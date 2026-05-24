import { findScheduleConflicts } from '@/lib/ai/scheduling-utils';
import { updateCard } from '@/lib/domain/cards/cardDetail';
import { listScheduledCards } from '@/lib/domain/scheduling/listScheduledCards';

import { calendarRangeFromContext, type ToolHandler } from './toolHelpers';

export const calendarToolHandlers: Record<string, ToolHandler> = {
  getCalendarSchedule: async (_input, ctx, _boardCtx) => {
    const { client, organizationId } = ctx;
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
  },

  findScheduleConflicts: async (input, ctx, _boardCtx) => {
    const { client, organizationId } = ctx;
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
  },

  rescheduleEvent: async (input, ctx, _boardCtx) => {
    const { client, organizationId, userId, role } = ctx;
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
  },
};
