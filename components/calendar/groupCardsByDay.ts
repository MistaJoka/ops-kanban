import { dayKey } from '@/lib/domain/calendar/weekDates';

import type { ScheduledCard } from '@/components/calendar/types';

export function groupCardsByDay(days: Date[], cards: ScheduledCard[]): Map<string, ScheduledCard[]> {
  const map = new Map<string, ScheduledCard[]>();

  for (const day of days) {
    map.set(dayKey(day), []);
  }

  for (const card of cards) {
    const key = dayKey(new Date(card.scheduledStart));
    map.set(key, [...(map.get(key) ?? []), card]);
  }

  return map;
}
