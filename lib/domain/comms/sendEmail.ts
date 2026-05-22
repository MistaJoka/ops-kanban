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
import { CommsError } from '@/lib/domain/comms/sendSms';

export async function sendCardEmail(
  client: SupabaseClient,
  params: {
    organizationId: string;
    cardId: string;
    actorId: string | null;
    toEmail?: string | null;
    subject?: string | null;
    body?: string;
    templateId?: string | null;
  },
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new CommsError('Resend is not configured.', 'SERVICE_UNAVAILABLE');
  }

  const card = await getCardDetail(client, params.organizationId, params.cardId);
  if (!card) {
    throw new CommsError('Card not found.', 'NOT_FOUND');
  }

  const toEmail = params.toEmail?.trim() || card.customer?.email?.trim();
  if (!toEmail) {
    throw new CommsError('Customer email is required to send email.', 'VALIDATION_ERROR');
  }

  let body = params.body?.trim() ?? '';
  let subject = params.subject?.trim() ?? `Update: ${card.title}`;
  let templateId: string | null = null;

  if (params.templateId) {
    const template = await getMessageTemplate(client, params.organizationId, params.templateId);
    if (!template || template.channel !== 'email') {
      throw new CommsError('Email template not found.', 'NOT_FOUND');
    }

    const rendered = renderTemplate(
      template.body,
      template.subject,
      buildTemplateVars({
        customerName: card.customer?.name,
        jobTitle: card.title,
        scheduledDate: card.scheduledStart,
      }),
    );
    body = rendered.body;
    subject = rendered.subject ?? subject;
    templateId = template.id;
  }

  if (!body) {
    throw new CommsError('Message body is required.', 'VALIDATION_ERROR');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? 'OpsBoard <onboarding@resend.dev>',
      to: [toEmail],
      subject,
      html: `<div style="font-family:sans-serif;line-height:1.5">${body.replace(/\n/g, '<br/>')}</div>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new CommsError(`Resend failed: ${detail}`, 'VALIDATION_ERROR');
  }

  const payload = (await response.json()) as { id?: string };

  const message = await insertMessage(client, {
    organizationId: params.organizationId,
    cardId: params.cardId,
    customerId: card.customer?.id ?? null,
    channel: 'email',
    direction: 'outbound',
    body,
    subject,
    provider: 'resend',
    externalId: payload.id ?? null,
    templateId,
    status: 'sent',
  });

  await logActivity(client, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    entityType: 'card',
    entityId: params.cardId,
    action: 'message.sent_email',
    summary: `Email sent to ${toEmail}`,
    metadata: { message_id: message.id, subject },
  });

  return message;
}
