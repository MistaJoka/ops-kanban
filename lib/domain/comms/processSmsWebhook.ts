import type { SupabaseClient } from '@supabase/supabase-js';

import type { CommsWebhookEvent } from '@/lib/integrations/types';
import { logActivity } from '@/lib/domain/activities/logActivity';
import { getPrimaryBoard } from '@/lib/domain/board/getBoard';
import {
  findCardByCustomerPhone,
  insertMessage,
  normalizePhone,
} from '@/lib/domain/comms/messages';
import {
  getIntegrationEvent,
  insertIntegrationEvent,
  markIntegrationEvent,
} from '@/lib/domain/integrations/processPaymentWebhook';

export type ProcessSmsWebhookResult =
  | { status: 'processed'; cardId: string }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; reason: string };

async function resolveColumnId(
  client: SupabaseClient,
  organizationId: string,
  boardId: string,
  stateKey: string,
): Promise<string> {
  const { data } = await client
    .from('columns')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('board_id', boardId)
    .eq('state_key', stateKey)
    .single();

  if (!data) {
    throw new Error(`Column "${stateKey}" not found.`);
  }

  return data.id;
}

export async function processSmsWebhook(
  client: SupabaseClient,
  event: CommsWebhookEvent,
): Promise<ProcessSmsWebhookResult> {
  const existing = await getIntegrationEvent(
    client,
    event.organizationId,
    event.provider,
    event.externalId,
  );

  if (existing?.process_status === 'processed' || existing?.process_status === 'skipped') {
    return { status: 'skipped', reason: 'Already processed.' };
  }

  if (!existing) {
    await insertIntegrationEvent(client, {
      organizationId: event.organizationId,
      provider: event.provider,
      eventType: event.eventType,
      externalId: event.externalId,
      payload: event.raw,
      processStatus: 'pending',
    });
  }

  let match = await findCardByCustomerPhone(client, event.organizationId, event.fromPhone);
  let cardId = match?.cardId;
  let customerId = match?.customerId ?? null;

  if (!cardId) {
    const board = await getPrimaryBoard(client, event.organizationId, true);
    const columnId = await resolveColumnId(client, event.organizationId, board.id, 'inquiry');
    const phoneLabel = normalizePhone(event.fromPhone);

    const { data: card, error } = await client
      .from('cards')
      .insert({
        organization_id: event.organizationId,
        board_id: board.id,
        column_id: columnId,
        title: `SMS inquiry — ${phoneLabel.slice(-4) || 'unknown'}`,
        description: event.body,
        priority: 'medium',
        next_action: 'Reply to inbound SMS',
      })
      .select('id')
      .single();

    if (error || !card) {
      await markIntegrationEvent(
        client,
        event.organizationId,
        event.provider,
        event.externalId,
        'failed',
        error?.message ?? 'Failed to create inquiry card.',
      );
      return { status: 'failed', reason: 'Failed to create inquiry card.' };
    }

    cardId = card.id;

    const { data: customer } = await client
      .from('customers')
      .insert({
        organization_id: event.organizationId,
        name: `SMS ${phoneLabel.slice(-4) || 'contact'}`,
        phone: event.fromPhone,
      })
      .select('id')
      .single();

    customerId = customer?.id ?? null;

    if (customerId) {
      await client
        .from('cards')
        .update({ customer_id: customerId })
        .eq('id', cardId)
        .eq('organization_id', event.organizationId);
    }
  }

  if (!cardId) {
    await markIntegrationEvent(
      client,
      event.organizationId,
      event.provider,
      event.externalId,
      'failed',
      'No card resolved.',
    );
    return { status: 'failed', reason: 'No card resolved.' };
  }

  await insertMessage(client, {
    organizationId: event.organizationId,
    cardId,
    customerId,
    channel: 'sms',
    direction: 'inbound',
    body: event.body,
    provider: 'twilio',
    externalId: event.externalId,
    status: 'received',
  });

  await logActivity(client, {
    organizationId: event.organizationId,
    actorId: null,
    entityType: 'card',
    entityId: cardId,
    action: 'message.received_sms',
    summary: `Inbound SMS from ${event.fromPhone}`,
    metadata: { external_id: event.externalId },
  });

  await markIntegrationEvent(
    client,
    event.organizationId,
    event.provider,
    event.externalId,
    'processed',
  );

  return { status: 'processed', cardId };
}
