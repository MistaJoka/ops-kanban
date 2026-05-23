'use client';

import { useEffect, useMemo, useState } from 'react';
import { AiPageCopilot } from '@/components/ai/AiPageCopilot';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type ScheduledCard = {
  id: string;
  title: string;
  scheduledStart: string;
  scheduledEnd: string | null;
  stateKey: string;
  columnName: string;
  assigneeName: string | null;
  customerName: string | null;
  customerAddress: string | null;
};

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [cards, setCards] = useState<ScheduledCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => {
    const start = weekStart.toISOString();
    const end = addDays(weekStart, 7).toISOString();
    return { start, end };
  }, [weekStart]);

  useEffect(() => {
    setLoading(true);
    void fetch(`/api/calendar?start=${encodeURIComponent(range.start)}&end=${encodeURIComponent(range.end)}`)
      .then((response) => response.json())
      .then((payload) => {
        if (payload.data) {
          setCards(payload.data);
          setError(null);
        } else {
          setError(payload.error ?? 'Failed to load calendar.');
        }
      })
      .catch(() => setError('Failed to load calendar.'))
      .finally(() => setLoading(false));
  }, [range.end, range.start]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const cardsByDay = useMemo(() => {
    const map = new Map<string, ScheduledCard[]>();
    for (const day of days) {
      map.set(day.toDateString(), []);
    }
    for (const card of cards) {
      const key = new Date(card.scheduledStart).toDateString();
      map.set(key, [...(map.get(key) ?? []), card]);
    }
    return map;
  }, [cards, days]);

  const todayKey = new Date().toDateString();

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="ops-toolbar">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="ops-page-title">Crew calendar</h1>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Scheduled jobs for the week
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setWeekStart((current) => addDays(current, -7))}
              className="ops-btn-secondary px-2.5"
              aria-label="Previous week"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" onClick={() => setWeekStart(startOfWeek(new Date()))} className="ops-btn-secondary">
              Today
            </button>
            <button
              type="button"
              onClick={() => setWeekStart((current) => addDays(current, 7))}
              className="ops-btn-secondary px-2.5"
              aria-label="Next week"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="ops-alert-error mx-4 mt-4">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mx-4 mt-8 text-sm text-[var(--text-secondary)]">Loading schedule…</p>
      ) : (
        <div className="grid flex-1 gap-2 p-3 md:grid-cols-7 md:gap-3 md:p-4">
          {days.map((day) => {
            const dayCards = cardsByDay.get(day.toDateString()) ?? [];
            const isToday = day.toDateString() === todayKey;

            return (
              <section
                key={day.toISOString()}
                className={`ops-section-card flex flex-col p-2.5 md:p-3 ${isToday ? 'ring-1 ring-[var(--accent-glow)]' : ''}`}
              >
                <h2
                  className={`text-xs font-semibold tracking-tight ${isToday ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}
                >
                  {day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </h2>
                <div className="mt-2 flex-1 space-y-1.5">
                  {dayCards.length === 0 ? (
                    <p className="py-4 text-center text-[11px] text-[var(--text-tertiary)]">—</p>
                  ) : (
                    dayCards.map((card) => (
                      <article
                        key={card.id}
                        className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-rail)] p-2"
                      >
                        <p className="line-clamp-2 text-xs font-medium leading-snug text-[var(--text-primary)]">
                          {card.title}
                        </p>
                        <p className="mt-1 text-[10px] tabular-nums text-[var(--text-tertiary)]">
                          {new Date(card.scheduledStart).toLocaleTimeString(undefined, {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <AiPageCopilot page="calendar" calendarRange={range} />
    </main>
  );
}
