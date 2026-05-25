'use client';

import { AiPageCopilot } from '@/components/ai/AiPageCopilot';
import { CalendarToolbar } from '@/components/calendar/CalendarToolbar';
import { CalendarWeekTable } from '@/components/calendar/CalendarWeekTable';
import { useCalendarWeek } from '@/components/calendar/useCalendarWeek';

export default function CalendarPage() {
  const calendar = useCalendarWeek();

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <CalendarToolbar
        onPreviousWeek={calendar.goToPreviousWeek}
        onToday={calendar.goToToday}
        onNextWeek={calendar.goToNextWeek}
      />

      {calendar.error ? (
        <p role="alert" className="ops-alert-error mx-4 mt-4">
          {calendar.error}
        </p>
      ) : null}

      {calendar.loading ? (
        <p className="mx-4 mt-8 text-sm text-[var(--text-secondary)]">Loading schedule…</p>
      ) : (
        <CalendarWeekTable days={calendar.days} cardsByDay={calendar.cardsByDay} />
      )}

      <AiPageCopilot page="calendar" calendarRange={calendar.range} />
    </main>
  );
}
