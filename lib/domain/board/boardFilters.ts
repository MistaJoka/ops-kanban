import type { BoardCardView } from '@/lib/domain/cards/boardCard';

export const BOARD_JOB_TYPES = [
  'maintenance',
  'install',
  'hardscape',
  'cleanup',
  'irrigation',
  'other',
] as const;

export type BoardJobType = (typeof BOARD_JOB_TYPES)[number];

export type AdvancedFilterKey =
  | 'all'
  | 'overdue'
  | 'scheduled'
  | 'archived'
  | 'assigned_to_me'
  | 'unassigned'
  | 'balance_due'
  | 'scheduled_this_week'
  | 'job_type';

export type AdvancedFilter = AdvancedFilterKey | { key: 'job_type'; jobType: string };

export const ADVANCED_FILTER_LABELS: Record<AdvancedFilterKey, string> = {
  all: 'All jobs',
  overdue: 'Overdue',
  scheduled: 'Scheduled',
  archived: 'Archived',
  assigned_to_me: 'Assigned to me',
  unassigned: 'Unassigned',
  balance_due: 'Balance due',
  scheduled_this_week: 'Scheduled this week',
  job_type: 'Job type',
};

function normalizeFilter(filter: AdvancedFilter): {
  key: AdvancedFilterKey;
  jobType?: string;
} {
  if (typeof filter === 'string') {
    return { key: filter };
  }

  return filter;
}

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function isScheduledThisWeek(scheduledStart: string | null, now = new Date()): boolean {
  if (!scheduledStart) {
    return false;
  }

  const scheduled = new Date(scheduledStart);
  if (Number.isNaN(scheduled.getTime())) {
    return false;
  }

  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return scheduled >= weekStart && scheduled < weekEnd;
}

export function matchesBoardSearch(card: BoardCardView, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  const haystack = [card.title, card.customerName, card.customerAddress, card.jobType]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export function matchesAdvancedFilter(
  card: BoardCardView,
  filter: AdvancedFilter,
  userId: string | null,
): boolean {
  const { key, jobType } = normalizeFilter(filter);

  switch (key) {
    case 'archived':
      return card.stateKey === 'archived';
    case 'overdue':
      return card.isOverdue;
    case 'scheduled':
      return Boolean(card.scheduledStart);
    case 'assigned_to_me':
      return Boolean(userId && card.assignedTo === userId);
    case 'unassigned':
      return !card.assignedTo;
    case 'balance_due':
      return card.moneyBadge === 'balance_due' || card.balanceDue > 0;
    case 'scheduled_this_week':
      return isScheduledThisWeek(card.scheduledStart);
    case 'job_type':
      return Boolean(jobType && card.jobType === jobType);
    case 'all':
    default:
      return card.stateKey !== 'archived';
  }
}

export function filterBoardCards(
  cards: BoardCardView[],
  search: string,
  filter: AdvancedFilter,
  userId: string | null,
): BoardCardView[] {
  return cards.filter(
    (card) => matchesBoardSearch(card, search) && matchesAdvancedFilter(card, filter, userId),
  );
}

export function getAdvancedFilterLabel(filter: AdvancedFilter): string {
  const { key, jobType } = normalizeFilter(filter);
  if (key === 'job_type' && jobType) {
    return `${ADVANCED_FILTER_LABELS.job_type}: ${jobType}`;
  }

  return ADVANCED_FILTER_LABELS[key];
}
