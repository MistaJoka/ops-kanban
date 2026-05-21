/**
 * AI context loader — keep payloads small. See docs/ai/AI_UTILIZATION.md §4.
 */

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

export type BoardAiContext = {
  page: 'board';
  pipelineMode: 'compact' | 'full';
  columns: Array<{ id: string; stateKey: string; name: string; cardCount: number }>;
  visibleCards: Array<{
    id: string;
    title: string;
    stateKey: string;
    dueDate?: string;
    scheduledStart?: string;
    assigneeName?: string;
    moneyBadge?: string;
  }>;
  metrics: {
    overdueCount: number;
    scheduledTodayCount: number;
    unpaidBalance: number;
  };
  rules: AiOrgRules;
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
};

export type AiOrgRules = {
  requireApprovalForMoneyActions: boolean;
  requireApprovalForBulkActions: boolean;
  aiMaySendExternalMessages: false;
};

export async function loadAiContext(input: AiContext): Promise<BoardAiContext | CardAiContext | AiContext> {
  const rules: AiOrgRules = {
    requireApprovalForMoneyActions: true,
    requireApprovalForBulkActions: true,
    aiMaySendExternalMessages: false,
  };

  if (input.page === 'card' && input.selectedCardId) {
    // TODO: Supabase — card, customer, quote, invoice, activities, comments
    return {
      page: 'card',
      card: { id: input.selectedCardId },
      customer: null,
      quote: null,
      invoice: null,
      recentActivities: [],
      recentComments: [],
      rules,
    };
  }

  if (input.page === 'board') {
    // TODO: Supabase — columns, capped card list, metrics
    return {
      page: 'board',
      pipelineMode: input.pipelineMode ?? 'compact',
      columns: [],
      visibleCards: [],
      metrics: { overdueCount: 0, scheduledTodayCount: 0, unpaidBalance: 0 },
      rules,
    };
  }

  return { ...input, rules };
}
