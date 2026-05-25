/** Monday-start week helpers for the crew calendar. */

export function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function buildWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function dayKey(date: Date): string {
  return date.toDateString();
}

export function formatDayHeader(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function weekRangeIso(weekStart: Date): { start: string; end: string } {
  return {
    start: weekStart.toISOString(),
    end: addDays(weekStart, 7).toISOString(),
  };
}
