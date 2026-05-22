import type { SupabaseClient } from '@supabase/supabase-js';

import type { BoardAiContext, CardAiContext } from '@/lib/ai/context-loader';
import { getPrimaryBoard } from '@/lib/domain/board/getBoard';
import { createCard } from '@/lib/domain/cards/createCard';
import { getCardDetail, updateCard } from '@/lib/domain/cards/cardDetail';
import { moveCard, MoveCardError } from '@/lib/domain/cards/moveCard';
import { upsertQuoteDraft } from '@/lib/domain/money/quotes';
import { sendCardEmail } from '@/lib/domain/comms/sendEmail';
import { sendCardSms } from '@/lib/domain/comms/sendSms';
import {
  buildTemplateVars,
  renderTemplate,
} from '@/lib/domain/comms/messageTemplates';
import { logActivity } from '@/lib/domain/activities/logActivity';

export type ToolRunContext = {
  client: SupabaseClient;
  organizationId: string;
  userId: string | null;
  role: 'owner' | 'manager' | 'worker' | 'viewer';
  loadedContext: BoardAiContext | CardAiContext;
};

async function getBoardMeta(client: SupabaseClient, organizationId: string) {
  return getPrimaryBoard(client, organizationId, true);
}

async function resolveColumnId(
  client: SupabaseClient,
  organizationId: string,
  boardId: string,
  columnStateKey: string,
): Promise<string> {
  const { data, error } = await client
    .from('columns')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('board_id', boardId)
    .eq('state_key', columnStateKey)
    .single();

  if (error || !data) {
    throw new Error(`Column "${columnStateKey}" not found.`);
  }

  return data.id;
}

function buildCardSummary(detail: NonNullable<Awaited<ReturnType<typeof getCardDetail>>>) {
  const lines = [
    `${detail.title} is in ${detail.stateKey.replace(/_/g, ' ')}.`,
    detail.customer?.address
      ? `Property: ${detail.customer.address}.`
      : detail.customer?.name
        ? `Customer: ${detail.customer.name}.`
        : null,
    detail.nextAction ? `Next action: ${detail.nextAction}.` : 'No next action set yet.',
    detail.scheduledStart
      ? `Scheduled: ${new Date(detail.scheduledStart).toLocaleDateString()}.`
      : null,
    detail.quoteTotal > 0 ? `Estimate total: $${detail.quoteTotal.toFixed(2)}.` : null,
  ].filter(Boolean);

  return lines.join(' ');
}

export async function runTool(
  toolName: string,
  input: Record<string, unknown>,
  ctx: ToolRunContext,
): Promise<{ message: string; data?: unknown; cardId?: string | null }> {
  const { client, organizationId, userId, role } = ctx;
  const boardView = await getBoardMeta(client, organizationId);
  const board =
    ctx.loadedContext.page === 'board'
      ? { ...boardView, boardId: ctx.loadedContext.boardId }
      : { ...boardView, boardId: boardView.id };

  switch (toolName) {
    case 'summarizeCard': {
      const cardId = String(input.cardId);
      const detail = await getCardDetail(client, organizationId, cardId);
      if (!detail) {
        throw new Error('Card not found.');
      }
      const summary = buildCardSummary(detail);
      return { message: summary, data: { summary }, cardId };
    }

    case 'getBoardState': {
      const message = boardView.columns
        .filter((column) => column.stateKey !== 'archived')
        .map((column) => {
          const count = boardView.cards.filter((card) => card.columnId === column.id).length;
          return `${column.name}: ${count}`;
        })
        .join(' · ');
      return {
        message: `Pipeline — ${message}`,
        data: {
          columns: boardView.columns,
          totalJobs: boardView.cards.filter((card) => card.stateKey !== 'archived').length,
        },
      };
    }

    case 'getOverdueCards': {
      const cards = boardView.cards.filter((card) => card.isOverdue);
      const limit = Number(input.limit ?? 10);
      const slice = cards.slice(0, limit);
      return {
        message: slice.length
          ? `Overdue: ${slice.map((card) => card.title).join(', ')}`
          : 'No overdue jobs right now.',
        data: slice,
      };
    }

    case 'getStalledCards': {
      const minDays = Number(input.minDays ?? 5);
      const stateKey = input.stateKey ? String(input.stateKey) : undefined;
      let cards = boardView.cards.filter((card) => card.daysInColumn >= minDays);
      if (stateKey) {
        cards = cards.filter((card) => card.stateKey === stateKey);
      }
      return {
        message: cards.length
          ? `Stalled (${minDays}+ days): ${cards.map((card) => card.title).join(', ')}`
          : `No jobs stalled ${minDays}+ days.`,
        data: cards.slice(0, 20),
      };
    }

    case 'suggestNextAction': {
      const cardId = String(input.cardId);
      const detail = await getCardDetail(client, organizationId, cardId);
      if (!detail) {
        throw new Error('Card not found.');
      }

      const suggestion =
        detail.stateKey === 'estimating'
          ? 'Finalize scope notes and draft the estimate line items.'
          : detail.stateKey === 'scheduled'
            ? 'Confirm crew assignment and site access notes.'
            : detail.stateKey === 'complete'
              ? 'Create the invoice draft and confirm balance due.'
              : 'Review property details and set the next follow-up date.';

      return { message: suggestion, data: { suggestion }, cardId };
    }

    case 'createCard': {
      const boardId = board.boardId;
      const stateKey = String(input.columnStateKey ?? 'inquiry');
      const columnId = input.columnId
        ? String(input.columnId)
        : await resolveColumnId(client, organizationId, boardId, stateKey);

      const card = await createCard(client, {
        organizationId,
        boardId,
        columnId,
        title: String(input.title),
        description: input.description ? String(input.description) : undefined,
        actorId: userId,
        role,
      });

      return {
        message: `Created job "${card.title}" in ${stateKey.replace(/_/g, ' ')}.`,
        data: card,
        cardId: card.id,
      };
    }

    case 'moveCard': {
      const cardId = String(input.cardId);
      const boardId = board.boardId;
      const targetColumnId = input.targetColumnId
        ? String(input.targetColumnId)
        : await resolveColumnId(
            client,
            organizationId,
            boardId,
            String(input.columnStateKey ?? 'inquiry'),
          );

      try {
        const card = await moveCard(client, {
          organizationId,
          cardId,
          targetColumnId,
          actorId: userId,
          role,
          reason: input.reason ? String(input.reason) : undefined,
        });

        return {
          message: `Moved "${card.title}" to ${card.stateKey.replace(/_/g, ' ')}.`,
          data: card,
          cardId: card.id,
        };
      } catch (error) {
        if (error instanceof MoveCardError) {
          throw new Error(error.message);
        }
        throw error;
      }
    }

    case 'updateCard': {
      const cardId = String(input.cardId);
      const detail = await updateCard(client, {
        organizationId,
        cardId,
        actorId: userId,
        patch: {
          nextAction: input.nextAction ? String(input.nextAction) : undefined,
          dueDate: input.dueDate ? String(input.dueDate) : undefined,
          scheduledStart: input.scheduledStart ? String(input.scheduledStart) : undefined,
          scheduledEnd: input.scheduledEnd ? String(input.scheduledEnd) : undefined,
          priority: input.priority as 'low' | 'medium' | 'high' | 'urgent' | undefined,
        },
      });

      return {
        message: `Updated job "${detail.title}".`,
        data: detail,
        cardId: detail.id,
      };
    }

    case 'assignCard': {
      const cardId = String(input.cardId);
      const detail = await updateCard(client, {
        organizationId,
        cardId,
        actorId: userId,
        patch: { assignedTo: String(input.assigneeId) },
      });

      return {
        message: `Assigned job "${detail.title}".`,
        data: detail,
        cardId: detail.id,
      };
    }

    case 'createQuoteDraft': {
      const cardId = String(input.cardId);
      const lineItems = (input.lineItems as Array<Record<string, unknown>>).map((item) => ({
        description: String(item.description),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      }));

      const quote = await upsertQuoteDraft(client, organizationId, cardId, userId, lineItems);

      return {
        message: `Saved estimate draft ($${quote.total.toFixed(2)}).`,
        data: quote,
        cardId,
      };
    }

    case 'sendSms': {
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
    }

    case 'sendEmail': {
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
    }

    case 'draftSms':
    case 'draftEmail': {
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
      const rendered =
        toolName === 'draftSms'
          ? renderTemplate(
              `Hi {{customer_name}}, ${intent} for {{job_title}} on {{scheduled_date}}. Reply if you have questions.`,
              null,
              vars,
            )
          : renderTemplate(
              `Hello {{customer_name}},\n\n${intent} regarding {{job_title}} scheduled for {{scheduled_date}}.\n\nThank you,`,
              `Update: {{job_title}}`,
              vars,
            );

      return {
        message: rendered.body,
        data: { body: rendered.body, subject: rendered.subject ?? null },
        cardId,
      };
    }

    default:
      throw new Error(`Tool not implemented: ${toolName}`);
  }
}

export async function logAiToolExecuted(
  client: SupabaseClient,
  params: {
    organizationId: string;
    userId: string | null;
    toolName: string;
    cardId?: string | null;
    summary: string;
  },
): Promise<void> {
  await logActivity(client, {
    organizationId: params.organizationId,
    actorId: params.userId,
    entityType: 'card',
    entityId: params.cardId ?? params.organizationId,
    action: 'ai.tool_executed',
    summary: params.summary,
    metadata: { tool_name: params.toolName },
  });
}
