import type { ScheduledCardView } from '@/lib/domain/scheduling/listScheduledCards';

export type ScheduleConflict = {
  cardId: string;
  title: string;
  scheduledStart: string;
  scheduledEnd: string | null;
  reason: string;
};

function overlaps(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return startA < endB && startB < endA;
}

export function findScheduleConflicts(
  cards: ScheduledCardView[],
  params: {
    cardId?: string;
    scheduledStart: string;
    scheduledEnd?: string | null;
  },
): ScheduleConflict[] {
  const start = new Date(params.scheduledStart).getTime();
  const end = params.scheduledEnd
    ? new Date(params.scheduledEnd).getTime()
    : start + 2 * 60 * 60 * 1000;

  const conflicts: ScheduleConflict[] = [];

  for (const card of cards) {
    if (params.cardId && card.id === params.cardId) {
      continue;
    }

    const otherStart = new Date(card.scheduledStart).getTime();
    const otherEnd = card.scheduledEnd
      ? new Date(card.scheduledEnd).getTime()
      : otherStart + 2 * 60 * 60 * 1000;

    if (overlaps(start, end, otherStart, otherEnd)) {
      conflicts.push({
        cardId: card.id,
        title: card.title,
        scheduledStart: card.scheduledStart,
        scheduledEnd: card.scheduledEnd,
        reason: 'Overlapping scheduled window',
      });
    }
  }

  return conflicts;
}
