'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CalendarDays, DollarSign, Kanban } from 'lucide-react';

import { AiPageCopilot } from '@/components/ai/AiPageCopilot';
import { CATEGORY_ACCENT, COLUMN_CATEGORY } from '@/lib/domain/pipeline/types';
import { cn } from '@/lib/utils';

type DashboardSummary = {
  scheduledToday: number;
  overdueCount: number;
  unpaidBalance: number;
  pipelineSnapshot: Array<{ stateKey: string; count: number }>;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const response = await fetch('/api/dashboard/summary');
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'Failed to load dashboard.');
        setLoading(false);
        return;
      }
      setSummary(payload.data);
      setLoading(false);
    })();
  }, []);

  const maxPipelineCount = useMemo(() => {
    if (!summary?.pipelineSnapshot.length) return 1;
    return Math.max(...summary.pipelineSnapshot.map((row) => row.count), 1);
  }, [summary?.pipelineSnapshot]);

  return (
    <main className="ops-page-shell">
      <header>
        <h1 className="ops-page-title text-2xl">Dashboard</h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
          Today&apos;s workload and outstanding balances from live job data.
        </p>
      </header>

      {error ? (
        <p role="alert" className="ops-alert-error mt-4">
          {error}
        </p>
      ) : null}

      {loading || !summary ? (
        <p className="mt-8 text-sm text-[var(--text-secondary)]">Loading…</p>
      ) : (
        <div className="mt-8 space-y-6">
          <section className="grid gap-4 sm:grid-cols-3">
            <article className="ops-stat-card">
              <div className="flex items-start justify-between gap-3">
                <p className="ops-stat-card__label">Scheduled today</p>
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[var(--accent-muted)] text-[var(--accent)]">
                  <CalendarDays className="size-4" strokeWidth={2} />
                </span>
              </div>
              <p className="ops-stat-card__value">{summary.scheduledToday}</p>
              <p className="ops-stat-card__hint">
                {summary.scheduledToday ? 'Jobs on the calendar today' : 'No jobs scheduled today.'}
              </p>
            </article>

            <article
              className={cn(
                'ops-stat-card',
                summary.overdueCount > 0 && 'border-[var(--urgent)]/30',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="ops-stat-card__label">Overdue follow-ups</p>
                <span
                  className={cn(
                    'inline-flex size-8 items-center justify-center rounded-lg',
                    summary.overdueCount > 0
                      ? 'bg-[rgba(196,77,52,0.1)] text-[var(--urgent)]'
                      : 'bg-[var(--surface-inset)] text-[var(--text-tertiary)]',
                  )}
                >
                  <AlertTriangle className="size-4" strokeWidth={2} />
                </span>
              </div>
              <p
                className={cn(
                  'ops-stat-card__value',
                  summary.overdueCount > 0 && 'text-[var(--urgent)]',
                )}
              >
                {summary.overdueCount}
              </p>
              <p className="ops-stat-card__hint">
                {summary.overdueCount ? 'Past due date and not archived' : 'No overdue follow-ups.'}
              </p>
            </article>

            <article className="ops-stat-card">
              <div className="flex items-start justify-between gap-3">
                <p className="ops-stat-card__label">Unpaid balance</p>
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[var(--surface-inset)] text-[var(--cat-billing)]">
                  <DollarSign className="size-4" strokeWidth={2} />
                </span>
              </div>
              <p className="ops-stat-card__value">${summary.unpaidBalance.toFixed(2)}</p>
              <p className="ops-stat-card__hint">
                {summary.unpaidBalance > 0 ? 'Outstanding invoice balances' : '$0 outstanding'}
              </p>
            </article>
          </section>

          <section className="ops-section-card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Kanban className="size-4 text-[var(--accent)]" strokeWidth={2.25} />
                <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                  Pipeline snapshot
                </h2>
              </div>
              <Link href="/pipeline" className="ops-link">
                Open pipeline
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <ul className="mt-4 space-y-2.5">
              {summary.pipelineSnapshot.map((row) => {
                const category = COLUMN_CATEGORY[row.stateKey] ?? 'sales';
                const accent = CATEGORY_ACCENT[category];
                const widthPct = row.count > 0 ? (row.count / maxPipelineCount) * 100 : 0;

                return (
                  <li key={row.stateKey}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ background: accent }}
                          aria-hidden
                        />
                        <span className="truncate font-mono text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                          {row.stateKey.replace(/_/g, ' ')}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-[var(--text-primary)]">
                        {row.count}
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-[var(--surface-inset)]">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${widthPct}%`,
                          background: accent,
                          opacity: row.count > 0 ? 0.85 : 0,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
      <AiPageCopilot page="dashboard" />
    </main>
  );
}
