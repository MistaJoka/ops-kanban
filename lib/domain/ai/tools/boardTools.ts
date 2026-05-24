import { buildDailyBrief, formatDailyBrief } from '@/lib/ai/daily-brief';
import { formatDisambiguationMessage, searchCardsByQuery } from '@/lib/ai/card-resolver';
import { summarizeCardWithGemini } from '@/lib/ai/gemini-agent';
import {
  staticNextActionSuggestion,
  suggestNextActionWithGemini,
} from '@/lib/ai/suggest-next-action';
import { loadOrgAiMemoriesForPrompt } from '@/lib/domain/ai/memories';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';
import { listCardComments } from '@/lib/domain/comments/cardComments';
import { listCardActivities } from '@/lib/domain/activities/listCardActivities';

import { buildCardSummary, type ToolHandler } from './toolHelpers';

export const boardToolHandlers: Record<string, ToolHandler> = {
  summarizeCard: async (input, ctx, _boardCtx) => {
    const { client, organizationId } = ctx;
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
  },

  getBoardState: async (_input, _ctx, { boardView }) => {
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
  },

  getOverdueCards: async (input, _ctx, { boardView }) => {
    const cards = boardView.cards.filter((card) => card.isOverdue);
    const limit = Number(input.limit ?? 10);
    const slice = cards.slice(0, limit);
    return {
      message: slice.length
        ? `Overdue: ${slice.map((card) => card.title).join(', ')}`
        : 'No overdue jobs right now.',
      data: slice,
    };
  },

  getStalledCards: async (input, _ctx, { boardView }) => {
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
  },

  getPipelineMetrics: async (_input, _ctx, { boardView }) => {
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
  },

  getDailyBrief: async (_input, ctx, _boardCtx) => {
    if (ctx.loadedContext.page !== 'board') {
      throw new Error('Daily brief is available from the board view.');
    }

    const brief = buildDailyBrief(ctx.loadedContext);
    const message = formatDailyBrief(brief, ctx.loadedContext.metrics);
    return { message, data: brief };
  },

  searchCards: async (input, _ctx, { boardView }) => {
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
  },

  suggestNextAction: async (input, ctx, _boardCtx) => {
    const { client, organizationId } = ctx;
    const cardId = String(input.cardId);
    const detail = await getCardDetail(client, organizationId, cardId);
    if (!detail) {
      throw new Error('Card not found.');
    }

    const [recentComments, recentActivities, orgMemoryPrompt] = await Promise.all([
      listCardComments(client, organizationId, cardId),
      listCardActivities(client, organizationId, cardId),
      loadOrgAiMemoriesForPrompt(client, organizationId),
    ]);

    const geminiSuggestion = await suggestNextActionWithGemini({
      detail,
      recentComments,
      recentActivities,
      orgMemoryPrompt,
    });

    const suggestion = geminiSuggestion ?? staticNextActionSuggestion(detail.stateKey);

    return { message: suggestion, data: { suggestion }, cardId };
  },
};
