import type { SupabaseClient } from '@supabase/supabase-js';

import type { LoadedAiContext } from '@/lib/ai/context-loader';
import { findScheduleConflicts } from '@/lib/ai/scheduling-utils';
import {
  formatMemberDisambiguation,
  searchMembersByQuery,
} from '@/lib/ai/member-resolver';
import { getPrimaryBoard } from '@/lib/domain/board/getBoard';
import { createCard } from '@/lib/domain/cards/createCard';
import { getCardDetail, updateCard } from '@/lib/domain/cards/cardDetail';
import { deleteCard, DeleteCardError } from '@/lib/domain/cards/deleteCard';
import { moveCard, MoveCardError } from '@/lib/domain/cards/moveCard';
import { createCardComment } from '@/lib/domain/comments/cardComments';
import { createCustomer } from '@/lib/domain/customers/createCustomer';
import {
  getUnpaidInvoicesList,
  summarizeCustomerHistoryText,
} from '@/lib/domain/customers/customerHistory';
import { listCustomers } from '@/lib/domain/customers/listCustomers';
import { createInvoicePaymentLink } from '@/lib/domain/integrations/payments';
import { createInvoiceDraft, getInvoiceForCard, markInvoicePaid } from '@/lib/domain/money/invoices';
import { getQuoteForCard, upsertQuoteDraft } from '@/lib/domain/money/quotes';
import { listOrgMembers } from '@/lib/domain/organization/listMembers';
import { getReportsSummary } from '@/lib/domain/reports/getReports';
import { listScheduledCards } from '@/lib/domain/scheduling/listScheduledCards';
import { buildDailyBrief, formatDailyBrief } from '@/lib/ai/daily-brief';
import { parseEstimateLineItems } from '@/lib/ai/estimate-parser';
import { summarizeCardWithGemini } from '@/lib/ai/gemini-agent';
import { searchCardsByQuery, formatDisambiguationMessage } from '@/lib/ai/card-resolver';
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
  loadedContext: LoadedAiContext;
};

function appOrigin(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

function calendarRangeFromContext(ctx: ToolRunContext): { start: string; end: string } {
  if (ctx.loadedContext.page === 'calendar') {
    return ctx.loadedContext.range;
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start: start.toISOString(), end: end.toISOString() };
}

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

      const activities = await import('@/lib/domain/activities/listCardActivities').then((mod) =>
        mod.listCardActivities(client, organizationId, cardId),
      );

      const llmSummary = await summarizeCardWithGemini(
        {
          title: detail.title,
          stateKey: detail.stateKey,
          nextAction: detail.nextAction,
          scheduledStart: detail.scheduledStart,
          description: detail.description,
          quoteTotal: detail.quoteTotal,
        },
        detail.customer,
        activities.slice(0, 5).map((item) => ({ action: item.action, summary: item.summary })),
      );

      const summary = llmSummary ?? buildCardSummary(detail);
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

    case 'getPipelineMetrics': {
      const active = boardView.cards.filter((card) => card.stateKey !== 'archived');
      const byColumn = boardView.columns
        .filter((column) => column.stateKey !== 'archived')
        .map((column) => {
          const columnCards = active.filter((card) => card.columnId === column.id);
          return {
            stateKey: column.stateKey,
            name: column.name,
            count: columnCards.length,
          };
        });

      const message = byColumn.map((column) => `${column.name}: ${column.count}`).join(' · ');
      return {
        message: `Pipeline metrics — ${message}`,
        data: { columns: byColumn, totalJobs: active.length },
      };
    }

    case 'getDailyBrief': {
      if (ctx.loadedContext.page !== 'board') {
        throw new Error('Daily brief is available from the board view.');
      }

      const brief = buildDailyBrief(ctx.loadedContext);
      const message = formatDailyBrief(brief, ctx.loadedContext.metrics);
      return { message, data: brief };
    }

    case 'searchCards': {
      const query = String(input.query);
      const limit = Number(input.limit ?? 5);
      const matches = searchCardsByQuery(boardView.cards, query, limit);

      if (matches.length === 0) {
        return { message: `No jobs matched “${query}”.`, data: [] };
      }

      if (matches.length > 1) {
        return {
          message: formatDisambiguationMessage(matches),
          data: matches,
        };
      }

      return {
        message: `Found: ${matches[0].title}${matches[0].customerAddress ? ` (${matches[0].customerAddress})` : ''}`,
        data: matches,
        cardId: matches[0].id,
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
        role,
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
      let assigneeId = input.assigneeId ? String(input.assigneeId) : null;

      if (!assigneeId && input.assigneeName) {
        const members = await listOrgMembers(client, organizationId);
        const matches = searchMembersByQuery(members, String(input.assigneeName), 5);
        if (matches.length === 1) {
          assigneeId = matches[0].userId;
        } else if (matches.length > 1) {
          throw new Error(formatMemberDisambiguation(matches));
        } else {
          throw new Error(`No team member matched "${String(input.assigneeName)}".`);
        }
      }

      if (!assigneeId) {
        throw new Error('assigneeId or assigneeName is required.');
      }

      const detail = await updateCard(client, {
        organizationId,
        cardId,
        actorId: userId,
        role,
        patch: { assignedTo: assigneeId },
      });

      return {
        message: `Assigned job "${detail.title}".`,
        data: detail,
        cardId: detail.id,
      };
    }

    case 'createQuoteDraft': {
      const cardId = String(input.cardId);
      const detail = await getCardDetail(client, organizationId, cardId);
      if (!detail) {
        throw new Error('Card not found.');
      }

      let lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;

      if (Array.isArray(input.lineItems) && input.lineItems.length > 0) {
        lineItems = (input.lineItems as Array<Record<string, unknown>>).map((item) => ({
          description: String(item.description),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        }));
      } else {
        const scopeNotes =
          (input.scopeNotes ? String(input.scopeNotes) : '') ||
          detail.description ||
          detail.title;

        const parsed = await parseEstimateLineItems({
          scopeNotes,
          jobTitle: detail.title,
          revenueHint: detail.revenueValue ?? undefined,
        });
        lineItems = parsed.lineItems;

        if (parsed.assumptions.length) {
          await createCardComment(
            client,
            organizationId,
            cardId,
            userId,
            `Estimate assumptions: ${parsed.assumptions.join('; ')}`,
          );
        }
      }

      const quote = await upsertQuoteDraft(client, organizationId, cardId, userId, lineItems);

      return {
        message: `Saved estimate draft ($${quote.total.toFixed(2)}). Review line items in the Estimate tab.`,
        data: quote,
        cardId,
      };
    }

    case 'createInternalNote': {
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
    }

    case 'updateCustomer': {
      const cardId = String(input.cardId);
      const detail = await getCardDetail(client, organizationId, cardId);
      if (!detail?.customer?.id) {
        throw new Error('This job has no linked customer to update.');
      }

      const patch: Record<string, string> = {};
      if (input.name) patch.name = String(input.name);
      if (input.phone) patch.phone = String(input.phone);
      if (input.email) patch.email = String(input.email);
      if (input.address) patch.address = String(input.address);
      if (input.notes) patch.notes = String(input.notes);

      const { error } = await client
        .from('customers')
        .update(patch)
        .eq('id', detail.customer.id)
        .eq('organization_id', organizationId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        message: `Updated customer for “${detail.title}”.`,
        data: patch,
        cardId,
      };
    }

    case 'markInvoicePaid': {
      const cardId = String(input.cardId);
      const invoice = await getInvoiceForCard(client, organizationId, cardId);
      if (!invoice) {
        throw new Error('No invoice found for this job.');
      }

      const paid = await markInvoicePaid(
        client,
        organizationId,
        invoice.id,
        userId,
        role,
        input.method ? String(input.method) : 'manual',
      );

      return {
        message: `Invoice marked paid ($${paid.total.toFixed(2)}).`,
        data: paid,
        cardId,
      };
    }

    case 'archiveCard': {
      const cardId = String(input.cardId);
      const boardId = board.boardId;
      const archivedColumnId = await resolveColumnId(client, organizationId, boardId, 'archived');

      try {
        const card = await moveCard(client, {
          organizationId,
          cardId,
          targetColumnId: archivedColumnId,
          actorId: userId,
          role,
          reason: input.reason ? String(input.reason) : 'Archived via AI copilot',
        });

        return {
          message: `Archived “${card.title}”.`,
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

    case 'deleteCard': {
      const cardId = String(input.cardId);
      const detail = await getCardDetail(client, organizationId, cardId);
      const title = detail?.title ?? 'job';

      try {
        await deleteCard(client, {
          organizationId,
          cardId,
          actorId: userId,
          role,
        });

        return {
          message: `Deleted “${title}”.`,
          data: { cardId, title },
          cardId,
        };
      } catch (error) {
        if (error instanceof DeleteCardError) {
          throw new Error(error.message);
        }
        throw error;
      }
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

    case 'createInvoiceDraft': {
      const cardId = String(input.cardId);
      const quote = await getQuoteForCard(client, organizationId, cardId);
      const invoice = await createInvoiceDraft(
        client,
        organizationId,
        cardId,
        userId,
        quote?.id,
      );

      return {
        message: `Invoice draft created ($${invoice.total.toFixed(2)}).`,
        data: invoice,
        cardId,
      };
    }

    case 'createPaymentLink': {
      const cardId = String(input.cardId);
      const invoice = await getInvoiceForCard(client, organizationId, cardId);
      if (!invoice) {
        throw new Error('Create an invoice draft before generating a payment link.');
      }

      const origin = appOrigin();
      const payment = await createInvoicePaymentLink(
        client,
        organizationId,
        invoice.id,
        userId,
        {
          successUrl: `${origin}/pipeline?payment=success`,
          cancelUrl: `${origin}/pipeline?payment=cancelled`,
        },
      );

      return {
        message: payment.paymentUrl
          ? `Payment link ready: ${payment.paymentUrl}`
          : 'Payment link created.',
        data: payment,
        cardId,
      };
    }

    case 'searchMembers': {
      const members = await listOrgMembers(client, organizationId);
      const matches = searchMembersByQuery(members, String(input.query), Number(input.limit ?? 5));
      return {
        message: matches.length
          ? matches.map((m) => `${m.fullName ?? m.userId} (${m.role})`).join(', ')
          : `No members matched "${String(input.query)}".`,
        data: matches,
      };
    }

    case 'getCalendarSchedule': {
      const range = calendarRangeFromContext(ctx);
      const cards =
        ctx.loadedContext.page === 'calendar'
          ? ctx.loadedContext.scheduledCards
          : await listScheduledCards(client, organizationId, range);

      return {
        message: cards.length
          ? `Scheduled: ${cards.map((c) => `${c.title} @ ${new Date(c.scheduledStart).toLocaleString()}`).join('; ')}`
          : 'No jobs scheduled in this range.',
        data: cards,
      };
    }

    case 'findScheduleConflicts': {
      const range = calendarRangeFromContext(ctx);
      const cards = await listScheduledCards(client, organizationId, range);
      const conflicts = findScheduleConflicts(cards, {
        cardId: input.cardId ? String(input.cardId) : undefined,
        scheduledStart: String(input.scheduledStart),
        scheduledEnd: input.scheduledEnd ? String(input.scheduledEnd) : null,
      });

      return {
        message: conflicts.length
          ? `Conflicts: ${conflicts.map((c) => c.title).join(', ')}`
          : 'No schedule conflicts for that window.',
        data: conflicts,
      };
    }

    case 'rescheduleEvent': {
      const cardId = String(input.cardId);
      const detail = await updateCard(client, {
        organizationId,
        cardId,
        actorId: userId,
        role,
        patch: {
          scheduledStart: String(input.scheduledStart),
          scheduledEnd: input.scheduledEnd ? String(input.scheduledEnd) : undefined,
        },
      });

      return {
        message: `Rescheduled "${detail.title}" to ${new Date(String(input.scheduledStart)).toLocaleString()}.`,
        data: detail,
        cardId: detail.id,
      };
    }

    case 'getUnpaidInvoices': {
      const minBalance = Number(input.minBalance ?? 0);
      const limit = Number(input.limit ?? 20);
      const rows = await getUnpaidInvoicesList(client, organizationId, minBalance, limit);
      const total = rows.reduce((sum, row) => sum + row.balanceDue, 0);

      return {
        message: rows.length
          ? `Unpaid ($${total.toFixed(2)}): ${rows.map((r) => `${r.jobTitle} $${r.balanceDue.toFixed(2)}`).join(', ')}`
          : 'No unpaid invoices.',
        data: rows,
      };
    }

    case 'getRevenueSummary': {
      const summary =
        ctx.loadedContext.page === 'reports'
          ? ctx.loadedContext.summary
          : await getReportsSummary(client, organizationId);

      const topColumns = summary.conversionByColumn
        .slice(0, 5)
        .map((row) => `${row.stateKey}: ${row.count}`)
        .join(' · ');

      return {
        message: `Revenue $${summary.totalRevenue.toFixed(2)} · Unpaid $${summary.unpaidBalance.toFixed(2)} · Pipeline: ${topColumns}`,
        data: summary,
      };
    }

    case 'summarizeCustomerHistory': {
      const customerId = String(input.customerId);
      const summary = await summarizeCustomerHistoryText(client, organizationId, customerId);
      return { message: summary, data: { summary }, cardId: null };
    }

    case 'searchCustomers': {
      const customers = await listCustomers(client, organizationId);
      const query = String(input.query).toLowerCase();
      const limit = Number(input.limit ?? 5);
      const matches = customers
        .filter((customer) =>
          [customer.name, customer.phone, customer.email, customer.address]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(query),
        )
        .slice(0, limit);

      return {
        message: matches.length
          ? matches.map((c) => `${c.name} (${c.jobCount} jobs)`).join(', ')
          : `No customers matched "${String(input.query)}".`,
        data: matches,
      };
    }

    case 'createCustomer': {
      const customer = await createCustomer(client, {
        organizationId,
        actorId: userId,
        role,
        name: String(input.name),
        phone: input.phone ? String(input.phone) : null,
        email: input.email ? String(input.email) : null,
        address: input.address ? String(input.address) : null,
        notes: input.notes ? String(input.notes) : null,
      });

      return {
        message: `Created customer "${customer.name}".`,
        data: customer,
        cardId: null,
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
