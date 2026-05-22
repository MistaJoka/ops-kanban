import type { BoardCardView } from '@/lib/domain/cards/boardCard';

export const BOARD_CARD_CAP = 40;

export type VisibleCardSummary = {
  id: string;
  title: string;
  stateKey: string;
  dueDate?: string;
  scheduledStart?: string;
  assigneeName?: string;
  moneyBadge?: string;
};

export function capVisibleCards(cards: BoardCardView[]): VisibleCardSummary[] {
  return cards.slice(0, BOARD_CARD_CAP).map((card) => ({
    id: card.id,
    title: card.title,
    stateKey: card.stateKey,
    dueDate: card.dueDate ?? undefined,
    scheduledStart: card.scheduledStart ?? undefined,
    moneyBadge: card.moneyBadge,
  }));
}

export function computeBoardMetrics(cards: BoardCardView[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let overdueCount = 0;
  let scheduledTodayCount = 0;

  for (const card of cards) {
    if (card.isOverdue) {
      overdueCount += 1;
    }

    if (card.scheduledStart) {
      const start = new Date(card.scheduledStart);
      if (start >= today && start < tomorrow) {
        scheduledTodayCount += 1;
      }
    }
  }

  return { overdueCount, scheduledTodayCount, unpaidBalance: 0 };
}
