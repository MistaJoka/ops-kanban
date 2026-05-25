'use client';

import { useEffect, useMemo, useState } from 'react';

import { groupCardsByDay } from '@/components/calendar/groupCardsByDay';
import type { ScheduledCard } from '@/components/calendar/types';
import { apiFetch } from '@/lib/client/apiFetch';
import {
  addDays,
  buildWeekDays,
  startOfWeek,
  weekRangeIso,
} from '@/lib/domain/calendar/weekDates';

export function useCalendarWeek() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [cards, setCards] = useState<ScheduledCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => weekRangeIso(weekStart), [weekStart]);
  const days = useMemo(() => buildWeekDays(weekStart), [weekStart]);
  const cardsByDay = useMemo(() => groupCardsByDay(days, cards), [cards, days]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);

      const result = await apiFetch<ScheduledCard[]>(
        `/api/calendar?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`,
      );

      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setCards(result.data ?? []);
      setLoading(false);
    })();
  }, [range.end, range.start]);

  return {
    weekStart,
    days,
    cardsByDay,
    range,
    loading,
    error,
    goToPreviousWeek: () => setWeekStart((current) => addDays(current, -7)),
    goToNextWeek: () => setWeekStart((current) => addDays(current, 7)),
    goToToday: () => setWeekStart(startOfWeek(new Date())),
  };
}
