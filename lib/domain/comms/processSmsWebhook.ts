import type { SupabaseClient } from '@supabase/supabase-js';

import type { CommsWebhookEvent } from '@/lib/integrations/types';
import { logActivity } from '@/lib/domain/activities/logActivity';
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
import { markIntakeIntegrationEvent, processIntake } from '@/lib/domain/intake/processIntake';

export type ProcessSmsWebhookResult =
  | { status: 'processed'; cardId: string }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; reason: string };

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

  const phoneLabel = normalizePhone(event.fromPhone);
  const knownMatch = await findCardByCustomerPhone(client, event.organizationId, event.fromPhone);

  if (knownMatch) {
    await insertMessage(client, {
      organizationId: event.organizationId,
      cardId: knownMatch.cardId,
      customerId: knownMatch.customerId,
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
      entityId: knownMatch.cardId,
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

    return { status: 'processed', cardId: knownMatch.cardId };
  }

  try {
    const intake = await processIntake(client, {
      organizationId: event.organizationId,
      channel: 'sms',
      source: 'twilio',
      externalId: event.externalId,
      idempotencyKey: `sms:${event.externalId}`,
      customerName: `SMS ${phoneLabel.slice(-4) || 'contact'}`,
      customerPhone: event.fromPhone,
      message: event.body,
      raw: event.raw,
    });

    await insertMessage(client, {
      organizationId: event.organizationId,
      cardId: intake.cardId,
      customerId: null,
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
      entityId: intake.cardId,
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

    return { status: 'processed', cardId: intake.cardId };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Failed to create inquiry card.';
    await markIntakeIntegrationEvent(client, {
      organizationId: event.organizationId,
      provider: event.provider,
      externalId: event.externalId,
      status: 'failed',
      errorMessage: reason,
    });
    return { status: 'failed', reason };
  }
}
