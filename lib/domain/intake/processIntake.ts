import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import { runAutomationsForColumnEnter } from '@/lib/domain/automations/runAutomations';
import { getPrimaryBoard } from '@/lib/domain/board/getBoard';
import { insertMessage } from '@/lib/domain/comms/messages';
import {
  insertIntegrationEvent,
  markIntegrationEvent,
} from '@/lib/domain/integrations/processPaymentWebhook';
import { inquiryIdempotencyKey } from '@/lib/domain/intake/inquiryPages';
import { findOpenCardByCustomerContact } from '@/lib/domain/intake/matchOpenCard';
import type { IntakeInput, ProcessIntakeResult } from '@/lib/domain/intake/types';
import {
  claimInquiryRequest,
  finalizeInquiryRequest,
} from '@/lib/domain/mutations/idempotency';

async function resolveColumnId(
  client: SupabaseClient,
  organizationId: string,
  boardId: string,
  stateKey: string,
): Promise<string> {
  const { data, error } = await client
    .from('columns')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('board_id', boardId)
    .eq('state_key', stateKey)
    .single();

  if (error || !data) {
    throw new Error(`Column "${stateKey}" not found.`);
  }

  return data.id;
}

function intakeMetadata(input: IntakeInput): Record<string, unknown> {
  return {
    channel: input.channel,
    source: input.source,
    campaign: input.campaign ?? null,
    external_id: input.externalId ?? null,
  };
}

async function attachIntakeToCard(
  client: SupabaseClient,
  input: IntakeInput,
  cardId: string,
  customerId: string | null,
  summary: string,
): Promise<ProcessIntakeResult> {
  const messageChannel = input.channel === 'sms' ? 'sms' : 'email';
  const messageProvider = input.channel === 'sms' ? 'twilio' : 'native';

  await insertMessage(client, {
    organizationId: input.organizationId,
    cardId,
    customerId,
    channel: messageChannel,
    direction: 'inbound',
    body: input.message.trim(),
    provider: messageProvider,
    externalId: input.externalId ?? null,
    status: 'received',
  });

  await logActivity(client, {
    organizationId: input.organizationId,
    actorId: null,
    entityType: 'card',
    entityId: cardId,
    action: 'inquiry.received',
    summary,
    metadata: intakeMetadata(input),
  });

  return {
    cardId,
    created: false,
    attached: true,
    idempotent: false,
  };
}

export async function processIntake(
  client: SupabaseClient,
  input: IntakeInput,
): Promise<ProcessIntakeResult> {
  const idempotencyKey =
    input.idempotencyKey ??
    inquiryIdempotencyKey({
      organizationId: input.organizationId,
      email: input.customerEmail,
      phone: input.customerPhone,
      message: input.message,
    });

  const claim = await claimInquiryRequest(client, input.organizationId, idempotencyKey);
  if (claim.status === 'cached') {
    return {
      cardId: claim.cardId,
      created: false,
      attached: false,
      idempotent: true,
    };
  }

  const openMatch = await findOpenCardByCustomerContact(
    client,
    input.organizationId,
    input.customerPhone,
    input.customerEmail,
  );

  if (openMatch) {
    const result = await attachIntakeToCard(
      client,
      input,
      openMatch.cardId,
      openMatch.customerId,
      `Inquiry from ${input.customerName.trim()} (${input.source})`,
    );
    await finalizeInquiryRequest(
      client,
      input.organizationId,
      idempotencyKey,
      openMatch.cardId,
    );
    return result;
  }

  const board = await getPrimaryBoard(client, input.organizationId, true);
  const columnId = await resolveColumnId(client, input.organizationId, board.id, 'inquiry');
  const title =
    input.channel === 'sms'
      ? `SMS inquiry — ${input.customerName.trim()}`
      : `${input.customerName.trim()} — inquiry`;

  const nextAction =
    input.channel === 'sms' ? 'Reply to inbound SMS' : 'Contact customer within 24h';

  const { data: cardId, error: rpcError } = await client.rpc('process_intake_create_atomic', {
    p_organization_id: input.organizationId,
    p_board_id: board.id,
    p_column_id: columnId,
    p_idempotency_key: idempotencyKey,
    p_title: title,
    p_description: input.message.trim(),
    p_next_action: nextAction,
    p_customer_name: input.customerName.trim(),
    p_customer_phone: input.customerPhone?.trim() || '',
    p_customer_email: input.customerEmail?.trim() || '',
    p_customer_address: input.customerAddress?.trim() || '',
    p_message: input.message.trim(),
    p_insert_message: input.channel !== 'sms',
  });

  if (rpcError || !cardId) {
    throw new Error(rpcError?.message ?? 'Atomic intake create failed.');
  }

  await logActivity(client, {
    organizationId: input.organizationId,
    actorId: null,
    entityType: 'card',
    entityId: cardId as string,
    action: 'inquiry.received',
    summary:
      input.channel === 'sms'
        ? `Inbound SMS inquiry from ${input.customerName.trim()}`
        : `Web inquiry from ${input.customerName.trim()} (${input.source})`,
    metadata: intakeMetadata(input),
  });

  await runAutomationsForColumnEnter(client, {
    organizationId: input.organizationId,
    cardId: cardId as string,
    cardTitle: title,
    stateKey: 'inquiry',
    actorId: null,
  });

  if (input.channel === 'webhook' && input.externalId) {
    await insertIntegrationEvent(client, {
      organizationId: input.organizationId,
      provider: 'native',
      eventType: 'inquiry.received',
      externalId: input.externalId,
      payload: input.raw ?? { message: input.message },
      cardId: cardId as string,
      processStatus: 'processed',
    });
  }

  return {
    cardId: cardId as string,
    created: true,
    attached: false,
    idempotent: false,
  };
}

export async function markIntakeIntegrationEvent(
  client: SupabaseClient,
  params: {
    organizationId: string;
    provider: string;
    externalId: string;
    status: 'processed' | 'failed' | 'skipped';
    errorMessage?: string;
  },
): Promise<void> {
  await markIntegrationEvent(
    client,
    params.organizationId,
    params.provider,
    params.externalId,
    params.status,
    params.errorMessage,
  );
}
