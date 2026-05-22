/**
 * AI context loader — keep payloads small. See docs/ai/AI_UTILIZATION.md §4.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  BOARD_CARD_CAP,
  capVisibleCards,
  computeBoardMetrics,
} from '@/lib/ai/context-utils';
import { getPrimaryBoard } from '@/lib/domain/board/getBoard';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';
import { listCardActivities } from '@/lib/domain/activities/listCardActivities';
import { listCardComments } from '@/lib/domain/comments/cardComments';
import { getInvoiceForCard } from '@/lib/domain/money/invoices';
import { getQuoteForCard } from '@/lib/domain/money/quotes';

export type AiPage = 'board' | 'card' | 'dashboard' | 'customer' | 'calendar' | 'reports' | 'settings';

export type AiMode = 'ask' | 'analyze' | 'act' | 'draft' | 'automate';

export type AiContext = {
  page: AiPage;
  organizationId: string;
  userId: string;
  role: 'owner' | 'manager' | 'worker' | 'viewer';
  mode?: AiMode;
  selectedCardId?: string;
  selectedCustomerId?: string;
  visibleColumnIds?: string[];
  pipelineMode?: 'compact' | 'full';
  filters?: {
    assignee?: string;
    overdue?: boolean;
    jobType?: string;
  };
};

export type AiOrgRules = {
  requireApprovalForMoneyActions: boolean;
  requireApprovalForBulkActions: boolean;
  aiMaySendExternalMessages: false;
};

export type BoardAiContext = {
  page: 'board';
  pipelineMode: 'compact' | 'full';
  columns: Array<{ id: string; stateKey: string; name: string; cardCount: number }>;
  visibleCards: ReturnType<typeof capVisibleCards>;
  metrics: {
    overdueCount: number;
    scheduledTodayCount: number;
    unpaidBalance: number;
  };
  rules: AiOrgRules;
  boardId: string;
};

export type CardAiContext = {
  page: 'card';
  card: Record<string, unknown>;
  customer: Record<string, unknown> | null;
  quote: Record<string, unknown> | null;
  invoice: Record<string, unknown> | null;
  recentActivities: Array<{ action: string; summary: string; createdAt: string }>;
  recentComments: Array<{ body: string; createdAt: string }>;
  rules: AiOrgRules;
  boardId?: string;
};

const defaultRules: AiOrgRules = {
  requireApprovalForMoneyActions: true,
  requireApprovalForBulkActions: true,
  aiMaySendExternalMessages: false,
};

export async function loadAiContext(
  client: SupabaseClient,
  input: AiContext,
): Promise<BoardAiContext | CardAiContext> {
  if (input.page === 'card' && input.selectedCardId) {
    const [detail, quote, invoice, activities, comments] = await Promise.all([
      getCardDetail(client, input.organizationId, input.selectedCardId),
      getQuoteForCard(client, input.organizationId, input.selectedCardId),
      getInvoiceForCard(client, input.organizationId, input.selectedCardId),
      listCardActivities(client, input.organizationId, input.selectedCardId),
      listCardComments(client, input.organizationId, input.selectedCardId),
    ]);

    if (!detail) {
      throw new Error('Card not found.');
    }

    return {
      page: 'card',
      card: {
        id: detail.id,
        title: detail.title,
        description: detail.description,
        columnId: detail.columnId,
        stateKey: detail.stateKey,
        priority: detail.priority,
        nextAction: detail.nextAction,
        dueDate: detail.dueDate,
        scheduledStart: detail.scheduledStart,
        scheduledEnd: detail.scheduledEnd,
        revenueValue: detail.revenueValue,
        jobType: detail.jobType,
        quoteTotal: detail.quoteTotal,
      },
      customer: detail.customer,
      quote: quote
        ? {
            id: quote.id,
            status: quote.status,
            total: quote.total,
            items: quote.items,
          }
        : null,
      invoice: invoice
        ? {
            id: invoice.id,
            status: invoice.status,
            total: invoice.total,
            balanceDue: invoice.balanceDue,
          }
        : null,
      recentActivities: activities.slice(0, 15).map((item) => ({
        action: item.action,
        summary: item.summary,
        createdAt: item.createdAt,
      })),
      recentComments: comments.slice(0, 5).map((item) => ({
        body: item.body,
        createdAt: item.createdAt,
      })),
      rules: defaultRules,
    };
  }

  const board = await getPrimaryBoard(client, input.organizationId, true);
  const activeCards = board.cards.filter((card) => card.stateKey !== 'archived');
  const metrics = computeBoardMetrics(activeCards);

  const columns = board.columns.map((column) => ({
    id: column.id,
    stateKey: column.stateKey,
    name: column.name,
    cardCount: activeCards.filter((card) => card.columnId === column.id).length,
  }));

  return {
    page: 'board',
    pipelineMode: board.pipelineMode,
    boardId: board.id,
    columns,
    visibleCards: capVisibleCards(activeCards),
    metrics: {
      ...metrics,
      unpaidBalance: metrics.unpaidBalance,
    },
    rules: defaultRules,
  };
}

export { BOARD_CARD_CAP };
