import { describe, expect, it } from 'vitest';

import { groupCardsByDay } from '@/components/calendar/groupCardsByDay';
import type { ScheduledCard } from '@/components/calendar/types';
import { addDays, buildWeekDays, dayKey, startOfWeek } from '@/lib/domain/calendar/weekDates';

function card(id: string, scheduledStart: string): ScheduledCard {
  return {
    id,
    title: `Job ${id}`,
    scheduledStart,
    scheduledEnd: null,
    stateKey: 'scheduled',
    columnName: 'Scheduled',
    assigneeName: null,
    customerName: null,
    customerAddress: null,
  };
}

describe('weekDates', () => {
  it('buildWeekDays returns seven days from Monday', () => {
    const weekStart = startOfWeek(new Date('2026-05-25T12:00:00'));
    const days = buildWeekDays(weekStart);

    expect(days).toHaveLength(7);
    expect(days[0].getDay()).toBe(1);
    expect(dayKey(days[6])).toBe(dayKey(addDays(weekStart, 6)));
  });
});

describe('groupCardsByDay', () => {
  it('groups scheduled cards by local day key', () => {
    const weekStart = startOfWeek(new Date('2026-05-25T12:00:00'));
    const days = buildWeekDays(weekStart);
    const monday = days[0];

    const grouped = groupCardsByDay(days, [
      card('a', `${monday.toISOString().slice(0, 10)}T09:00:00.000Z`),
      card('b', `${addDays(monday, 1).toISOString().slice(0, 10)}T10:00:00.000Z`),
    ]);

    expect(grouped.get(dayKey(monday))).toHaveLength(1);
    expect(grouped.get(dayKey(addDays(monday, 1)))).toHaveLength(1);
    expect(grouped.get(dayKey(addDays(monday, 2)))).toHaveLength(0);
  });
});
