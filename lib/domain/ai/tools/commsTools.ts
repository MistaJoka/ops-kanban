import { createCardComment } from '@/lib/domain/comments/cardComments';
import { sendCardEmail } from '@/lib/domain/comms/sendEmail';
import { sendCardSms } from '@/lib/domain/comms/sendSms';
import { buildTemplateVars, renderTemplate } from '@/lib/domain/comms/messageTemplates';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';

import { type ToolHandler } from './toolHelpers';

export const commsToolHandlers: Record<string, ToolHandler> = {
  createInternalNote: async (input, ctx, _boardCtx) => {
    const { client, organizationId, userId } = ctx;
    const cardId = String(input.cardId);
    const comment = await createCardComment(
      client,
      organizationId,
      cardId,
      userId,
      String(input.body),
    );

    return {
      message: 'Internal note added to the job timeline.',
      data: comment,
      cardId,
    };
  },

  draftSms: async (input, ctx, _boardCtx) => {
    const { client, organizationId } = ctx;
    const cardId = String(input.cardId);
    const detail = await getCardDetail(client, organizationId, cardId);
    if (!detail) {
      throw new Error('Card not found.');
    }

    const vars = buildTemplateVars({
      customerName: detail.customer?.name,
      jobTitle: detail.title,
      scheduledDate: detail.scheduledStart,
    });

    const intent = input.intent ? String(input.intent) : 'follow up';
    const rendered = renderTemplate(
      `Hi {{customer_name}}, ${intent} for {{job_title}} on {{scheduled_date}}. Reply if you have questions.`,
      null,
      vars,
    );

    return {
      message: rendered.body,
      data: { body: rendered.body, subject: rendered.subject ?? null },
      cardId,
    };
  },

  draftEmail: async (input, ctx, _boardCtx) => {
    const { client, organizationId } = ctx;
    const cardId = String(input.cardId);
    const detail = await getCardDetail(client, organizationId, cardId);
    if (!detail) {
      throw new Error('Card not found.');
    }

    const vars = buildTemplateVars({
      customerName: detail.customer?.name,
      jobTitle: detail.title,
      scheduledDate: detail.scheduledStart,
    });

    const intent = input.intent ? String(input.intent) : 'follow up';
    const rendered = renderTemplate(
      `Hello {{customer_name}},\n\n${intent} regarding {{job_title}} scheduled for {{scheduled_date}}.\n\nThank you,`,
      `Update: {{job_title}}`,
      vars,
    );

    return {
      message: rendered.body,
      data: { body: rendered.body, subject: rendered.subject ?? null },
      cardId,
    };
  },

  sendSms: async (input, ctx, _boardCtx) => {
    const { client, organizationId, userId } = ctx;
    const cardId = String(input.cardId);
    const message = await sendCardSms(client, {
      organizationId,
      cardId,
      actorId: userId,
      body: input.body ? String(input.body) : undefined,
      templateId: input.templateId ? String(input.templateId) : undefined,
    });

    return {
      message: `SMS sent (${message.body.slice(0, 80)}).`,
      data: message,
      cardId,
    };
  },

  sendEmail: async (input, ctx, _boardCtx) => {
    const { client, organizationId, userId } = ctx;
    const cardId = String(input.cardId);
    const message = await sendCardEmail(client, {
      organizationId,
      cardId,
      actorId: userId,
      subject: input.subject ? String(input.subject) : undefined,
      body: input.body ? String(input.body) : undefined,
      templateId: input.templateId ? String(input.templateId) : undefined,
    });

    return {
      message: `Email sent${message.subject ? `: ${message.subject}` : ''}.`,
      data: message,
      cardId,
    };
  },
};
