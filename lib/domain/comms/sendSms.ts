import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';
import {
  buildTemplateVars,
  getMessageTemplate,
  renderTemplate,
} from '@/lib/domain/comms/messageTemplates';
import { insertMessage } from '@/lib/domain/comms/messages';
import { twilioCommsAdapter, isTwilioConfigured } from '@/lib/integrations/twilio/adapter';

export class CommsError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_FOUND' | 'VALIDATION_ERROR' | 'SERVICE_UNAVAILABLE',
  ) {
    super(message);
    this.name = 'CommsError';
  }
}

export async function sendCardSms(
  client: SupabaseClient,
  params: {
    organizationId: string;
    cardId: string;
    actorId: string | null;
    body?: string;
    templateId?: string | null;
  },
) {
  if (!isTwilioConfigured()) {
    throw new CommsError('Twilio is not configured.', 'SERVICE_UNAVAILABLE');
  }

  const card = await getCardDetail(client, params.organizationId, params.cardId);
  if (!card) {
    throw new CommsError('Card not found.', 'NOT_FOUND');
  }

  const phone = card.customer?.phone;
  if (!phone?.trim()) {
    throw new CommsError('Customer phone number is required to send SMS.', 'VALIDATION_ERROR');
  }

  let body = params.body?.trim() ?? '';
  let templateId: string | null = null;

  if (params.templateId) {
    const template = await getMessageTemplate(client, params.organizationId, params.templateId);
    if (!template || template.channel !== 'sms') {
      throw new CommsError('SMS template not found.', 'NOT_FOUND');
    }

    const rendered = renderTemplate(
      template.body,
      null,
      buildTemplateVars({
        customerName: card.customer?.name,
        jobTitle: card.title,
        scheduledDate: card.scheduledStart,
      }),
    );
    body = rendered.body;
    templateId = template.id;
  }

  if (!body) {
    throw new CommsError('Message body is required.', 'VALIDATION_ERROR');
  }

  const sent = await twilioCommsAdapter.sendSms({ to: phone, body });

  const message = await insertMessage(client, {
    organizationId: params.organizationId,
    cardId: params.cardId,
    customerId: card.customer?.id ?? null,
    channel: 'sms',
    direction: 'outbound',
    body,
    provider: 'twilio',
    externalId: sent.externalId,
    templateId,
    status: 'sent',
  });

  await logActivity(client, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    entityType: 'card',
    entityId: params.cardId,
    action: 'message.sent_sms',
    summary: `SMS sent to ${phone}`,
    metadata: { message_id: message.id, external_id: sent.externalId },
  });

  return message;
}
