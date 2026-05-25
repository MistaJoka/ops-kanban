import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import { isDueSoon } from '@/lib/domain/cards/boardCardFormatters';
import type { ColumnCategory } from '@/lib/domain/pipeline/types';

export type BoardSignalKey = 'jobType' | 'money' | 'due' | 'schedule' | 'daysInColumn';

const MAX_VISIBLE_SIGNALS = 2;

const CATEGORY_ORDER: Record<ColumnCategory, BoardSignalKey[]> = {
  sales: ['money', 'due', 'jobType', 'daysInColumn', 'schedule'],
  production: ['schedule', 'due', 'jobType', 'money', 'daysInColumn'],
  billing: ['money', 'due', 'schedule', 'jobType', 'daysInColumn'],
  aftercare: ['jobType', 'money', 'due', 'schedule', 'daysInColumn'],
};

function isSignalAvailable(card: BoardCardView, key: BoardSignalKey): boolean {
  switch (key) {
    case 'jobType':
      return Boolean(card.jobType);
    case 'money':
      return card.moneyBadge !== 'none';
    case 'due':
      return Boolean(card.dueDate && (card.isOverdue || isDueSoon(card.dueDate)));
    case 'schedule':
      return Boolean(card.scheduledStart);
    case 'daysInColumn':
      return card.columnCategory === 'sales' && card.daysInColumn > 2;
    default:
      return false;
  }
}

export function pickVisibleBoardSignals(card: BoardCardView): {
  visible: BoardSignalKey[];
  overflow: number;
} {
  const order = CATEGORY_ORDER[card.columnCategory] ?? CATEGORY_ORDER.sales;
  const available = order.filter((key) => isSignalAvailable(card, key));
  const visible = available.slice(0, MAX_VISIBLE_SIGNALS);
  const overflow = Math.max(0, available.length - visible.length);

  return { visible, overflow };
}

export function hasDueSignalInMeta(card: BoardCardView): boolean {
  return pickVisibleBoardSignals(card).visible.includes('due');
}
