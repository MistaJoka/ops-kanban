import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

import { recordSignature } from '@/lib/domain/documents/signatures';

export type PortalScope = 'view_estimate' | 'approve' | 'pay' | 'view_schedule';

export type PortalTokenView = {
  token: string;
  expiresAt: string;
  scopes: PortalScope[];
  portalUrl: string;
};

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createPortalToken(
  client: SupabaseClient,
  params: {
    organizationId: string;
    cardId: string;
    scopes?: PortalScope[];
    expiresInHours?: number;
    baseUrl: string;
  },
): Promise<PortalTokenView> {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + (params.expiresInHours ?? 168) * 3_600_000).toISOString();
  const scopes = params.scopes ?? ['view_estimate', 'approve', 'pay', 'view_schedule'];

  const { error } = await client.from('portal_tokens').insert({
    organization_id: params.organizationId,
    card_id: params.cardId,
    token_hash: tokenHash,
    scopes,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    token,
    expiresAt,
    scopes,
    portalUrl: `${params.baseUrl}/p/${token}`,
  };
}

export async function verifyPortalToken(client: SupabaseClient, token: string) {
  const tokenHash = hashToken(token);
  const now = new Date().toISOString();

  const { data, error } = await client
    .from('portal_tokens')
    .select('id, organization_id, card_id, scopes, expires_at')
    .eq('token_hash', tokenHash)
    .gt('expires_at', now)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id as string,
    organizationId: data.organization_id as string,
    cardId: data.card_id as string,
    scopes: data.scopes as PortalScope[],
    expiresAt: data.expires_at as string,
  };
}

export async function approveEstimateViaPortal(
  client: SupabaseClient,
  params: {
    organizationId: string;
    cardId: string;
    tokenId: string;
    signerName?: string | null;
    signerIp?: string | null;
  },
) {
  const { data: quote, error: quoteError } = await client
    .from('quotes')
    .select('id, status, total')
    .eq('organization_id', params.organizationId)
    .eq('card_id', params.cardId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (quoteError || !quote) {
    throw new Error('No estimate found for this job.');
  }

  if (Number(quote.total) <= 0) {
    throw new Error('Estimate must have line items before approval.');
  }

  const { data: approvedColumn } = await client
    .from('cards')
    .select('board_id')
    .eq('id', params.cardId)
    .eq('organization_id', params.organizationId)
    .single();

  if (!approvedColumn) {
    throw new Error('Card not found.');
  }

  const { data: column } = await client
    .from('columns')
    .select('id')
    .eq('board_id', approvedColumn.board_id)
    .eq('organization_id', params.organizationId)
    .eq('state_key', 'approved')
    .single();

  if (!column) {
    throw new Error('Approved column not found.');
  }

  await client
    .from('quotes')
    .update({ status: 'sent', updated_at: new Date().toISOString() })
    .eq('id', quote.id);

  await client
    .from('cards')
    .update({ column_id: column.id, updated_at: new Date().toISOString() })
    .eq('id', params.cardId)
    .eq('organization_id', params.organizationId);

  await client
    .from('portal_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', params.tokenId);

  await recordSignature(client, {
    organizationId: params.organizationId,
    cardId: params.cardId,
    quoteId: quote.id,
    signerName: params.signerName ?? null,
    signerIp: params.signerIp ?? null,
    provider: 'native',
  });

  return { quoteId: quote.id, total: Number(quote.total) };
}
