import type { SupabaseClient } from '@supabase/supabase-js';

export type IdempotentRecord = {
  response: unknown;
  httpStatus: number;
  cardId: string | null;
};

export const PENDING_MUTATION_MARKER = { _pending: true } as const;

const PENDING_HTTP_STATUS = 102;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isPendingMutationResponse(response: unknown): boolean {
  return (
    typeof response === 'object' &&
    response !== null &&
    '_pending' in response &&
    (response as { _pending: unknown })._pending === true
  );
}

function isDuplicateKeyError(message: string, code?: string): boolean {
  return code === '23505' || /duplicate key|unique constraint/i.test(message);
}

function isMissingTableError(message: string): boolean {
  return /relation "client_mutations" does not exist|schema cache|could not find the table/i.test(
    message,
  );
}

export function readClientMutationId(request: Request): string | null {
  const value = request.headers.get('X-Client-Mutation-Id')?.trim();
  return value && value.length > 0 ? value : null;
}

export async function readIdempotentResponse(
  client: SupabaseClient,
  organizationId: string,
  clientMutationId: string,
): Promise<IdempotentRecord | null> {
  const { data, error } = await client
    .from('client_mutations')
    .select('response, http_status, card_id')
    .eq('organization_id', organizationId)
    .eq('client_mutation_id', clientMutationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    response: data.response,
    httpStatus: data.http_status,
    cardId: data.card_id,
  };
}

export async function waitForCompletedMutation(
  client: SupabaseClient,
  organizationId: string,
  clientMutationId: string,
  maxAttempts = 20,
): Promise<IdempotentRecord | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const cached = await readIdempotentResponse(client, organizationId, clientMutationId);
    if (cached && !isPendingMutationResponse(cached.response)) {
      return cached;
    }
    await sleep(50 * (attempt + 1));
  }

  return null;
}

export type ClaimMutationResult =
  | { status: 'claimed' }
  | { status: 'cached'; record: IdempotentRecord };

export async function claimClientMutation(
  client: SupabaseClient,
  organizationId: string,
  clientMutationId: string,
): Promise<ClaimMutationResult | null> {
  const { error } = await client.from('client_mutations').insert({
    organization_id: organizationId,
    client_mutation_id: clientMutationId,
    response: PENDING_MUTATION_MARKER,
    http_status: PENDING_HTTP_STATUS,
    card_id: null,
  });

  if (!error) {
    return { status: 'claimed' };
  }

  if (isDuplicateKeyError(error.message, error.code)) {
    const existing = await readIdempotentResponse(client, organizationId, clientMutationId);
    if (existing) {
      return { status: 'cached', record: existing };
    }

    const cached = await waitForCompletedMutation(client, organizationId, clientMutationId);
    if (cached) {
      return { status: 'cached', record: cached };
    }

    throw new Error('Idempotency claim timed out waiting for concurrent mutation.');
  }

  if (isMissingTableError(error.message)) {
    return null;
  }

  throw new Error(error.message);
}

export async function completeClientMutation(
  client: SupabaseClient,
  input: {
    organizationId: string;
    clientMutationId: string;
    response: unknown;
    httpStatus?: number;
    cardId?: string | null;
  },
): Promise<void> {
  const { error } = await client
    .from('client_mutations')
    .update({
      response: input.response,
      http_status: input.httpStatus ?? 200,
      card_id: input.cardId ?? null,
    })
    .eq('organization_id', input.organizationId)
    .eq('client_mutation_id', input.clientMutationId);

  if (error) {
    if (isMissingTableError(error.message)) {
      return;
    }
    throw new Error(error.message);
  }
}

/** @deprecated Use claimClientMutation + completeClientMutation */
export async function writeIdempotentResponse(
  client: SupabaseClient,
  input: {
    organizationId: string;
    clientMutationId: string;
    response: unknown;
    httpStatus?: number;
    cardId?: string | null;
  },
): Promise<void> {
  const claim = await claimClientMutation(client, input.organizationId, input.clientMutationId);
  if (claim?.status === 'cached') {
    return;
  }

  await completeClientMutation(client, input);
}

export type ClaimInquiryResult =
  | { status: 'claimed' }
  | { status: 'cached'; cardId: string };

export async function claimInquiryRequest(
  client: SupabaseClient,
  organizationId: string,
  idempotencyKey: string,
): Promise<ClaimInquiryResult> {
  const { error } = await client.from('inquiry_requests').insert({
    organization_id: organizationId,
    idempotency_key: idempotencyKey,
    card_id: null,
  });

  if (!error) {
    return { status: 'claimed' };
  }

  if (!isDuplicateKeyError(error.message)) {
    throw new Error(error.message);
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data } = await client
      .from('inquiry_requests')
      .select('card_id')
      .eq('organization_id', organizationId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (data?.card_id) {
      return { status: 'cached', cardId: data.card_id as string };
    }

    await sleep(50 * (attempt + 1));
  }

  throw new Error('Inquiry idempotency claim timed out waiting for concurrent request.');
}

export async function finalizeInquiryRequest(
  client: SupabaseClient,
  organizationId: string,
  idempotencyKey: string,
  cardId: string,
): Promise<void> {
  const { error } = await client
    .from('inquiry_requests')
    .update({ card_id: cardId })
    .eq('organization_id', organizationId)
    .eq('idempotency_key', idempotencyKey);

  if (error) {
    throw new Error(error.message);
  }
}

export type ClaimBookingResult =
  | { status: 'claimed' }
  | { status: 'cached'; cardId: string };

export async function claimBookingRequest(
  client: SupabaseClient,
  organizationId: string,
  idempotencyKey: string,
): Promise<ClaimBookingResult> {
  const { error } = await client.from('booking_requests').insert({
    organization_id: organizationId,
    idempotency_key: idempotencyKey,
    card_id: null,
  });

  if (!error) {
    return { status: 'claimed' };
  }

  if (!isDuplicateKeyError(error.message)) {
    throw new Error(error.message);
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data } = await client
      .from('booking_requests')
      .select('card_id')
      .eq('organization_id', organizationId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (data?.card_id) {
      return { status: 'cached', cardId: data.card_id as string };
    }

    await sleep(50 * (attempt + 1));
  }

  throw new Error('Booking idempotency claim timed out waiting for concurrent request.');
}
