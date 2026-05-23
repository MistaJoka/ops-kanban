/**
 * AI context loader — keep payloads small. See docs/ai/AI_UTILIZATION.md §4.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { BOARD_CARD_CAP, capVisibleCards, computeBoardMetrics } from '@/lib/ai/context-utils';
import { getPrimaryBoard } from '@/lib/domain/board/getBoard';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';
import { listCardActivities } from '@/lib/domain/activities/listCardActivities';
import { listCardComments } from '@/lib/domain/comments/cardComments';
import { getCustomerHistory } from '@/lib/domain/customers/customerHistory';
import { listCustomers } from '@/lib/domain/customers/listCustomers';
import { getDashboardSummary } from '@/lib/domain/dashboard/getDashboardSummary';
import { getInvoiceForCard } from '@/lib/domain/money/invoices';
import { getQuoteForCard } from '@/lib/domain/money/quotes';
import { getReportsSummary } from '@/lib/domain/reports/getReports';
import { listScheduledCards } from '@/lib/domain/scheduling/listScheduledCards';

export type AiPage =
  | 'board'
  | 'card'
  | 'dashboard'
  | 'customer'
  | 'calendar'
  | 'reports'
  | 'settings';

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
  calendarRange?: { start: string; end: string };
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

export type DashboardAiContext = {
  page: 'dashboard';
  summary: Awaited<ReturnType<typeof getDashboardSummary>>;
  rules: AiOrgRules;
};

export type CalendarAiContext = {
  page: 'calendar';
  range: { start: string; end: string };
  scheduledCards: Awaited<ReturnType<typeof listScheduledCards>>;
  rules: AiOrgRules;
};

export type CustomerAiContext = {
  page: 'customer';
  selectedCustomer: Awaited<ReturnType<typeof getCustomerHistory>> | null;
  customers: Array<{ id: string; name: string; jobCount: number }>;
  rules: AiOrgRules;
};

export type ReportsAiContext = {
  page: 'reports';
  summary: Awaited<ReturnType<typeof getReportsSummary>>;
  rules: AiOrgRules;
};

export type LoadedAiContext =
  | BoardAiContext
  | CardAiContext
  | DashboardAiContext
  | CalendarAiContext
  | CustomerAiContext
  | ReportsAiContext;

const defaultRules: AiOrgRules = {
  requireApprovalForMoneyActions: true,
  requireApprovalForBulkActions: true,
  aiMaySendExternalMessages: false,
};

function defaultCalendarRange(): { start: string; end: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function loadAiContext(
  client: SupabaseClient,
  input: AiContext,
): Promise<LoadedAiContext> {
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

  if (input.page === 'dashboard') {
    const summary = await getDashboardSummary(client, input.organizationId);
    return { page: 'dashboard', summary, rules: defaultRules };
  }

  if (input.page === 'calendar') {
    const range = input.calendarRange ?? defaultCalendarRange();
    const scheduledCards = await listScheduledCards(client, input.organizationId, range);
    return { page: 'calendar', range, scheduledCards, rules: defaultRules };
  }

  if (input.page === 'customer') {
    const customers = await listCustomers(client, input.organizationId);
    const selectedCustomer = input.selectedCustomerId
      ? await getCustomerHistory(client, input.organizationId, input.selectedCustomerId)
      : null;

    return {
      page: 'customer',
      selectedCustomer,
      customers: customers.slice(0, 30).map((row) => ({
        id: row.id,
        name: row.name,
        jobCount: row.jobCount,
      })),
      rules: defaultRules,
    };
  }

  if (input.page === 'reports') {
    const summary = await getReportsSummary(client, input.organizationId);
    return { page: 'reports', summary, rules: defaultRules };
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
