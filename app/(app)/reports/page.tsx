'use client';

import { AiPageCopilot } from '@/components/ai/AiPageCopilot';
import { apiFetch } from '@/lib/client/apiFetch';
import { useCallback, useEffect, useState } from 'react';

type ReportsSummary = {
  conversionByColumn: Array<{ stateKey: string; count: number }>;
  avgCycleDays: number | null;
  archivedCount: number;
  revenueByJobType: Array<{ jobType: string; revenue: number; jobCount: number }>;
  totalRevenue: number;
  unpaidBalance: number;
  dateFrom: string | null;
  dateTo: string | null;
};

type ArRegisterRow = {
  invoiceId: string;
  cardId: string;
  customerName: string;
  cardTitle: string;
  balanceDue: number;
  total: number;
  dueDate: string | null;
  daysPastDue: number;
  agingBucket: string;
  status: string;
};

type AccountingTransaction = {
  id: string;
  entryType: string;
  amount: number;
  customerName: string | null;
  cardTitle: string | null;
  description: string;
  occurredAt: string;
};

type AccountingData = {
  arRegister: ArRegisterRow[];
  arAging: Record<string, number>;
  transactions: AccountingTransaction[];
};

function labelState(stateKey: string): string {
  return stateKey.replace(/_/g, ' ');
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [accounting, setAccounting] = useState<AccountingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', `${dateFrom}T00:00:00.000Z`);
      if (dateTo) params.set('dateTo', `${dateTo}T23:59:59.999Z`);

      const query = params.toString();
      const [reportsResult, accountingResult] = await Promise.all([
        apiFetch<ReportsSummary>(`/api/reports?${query}`),
        apiFetch<AccountingData>(`/api/accounting?${query}`),
      ]);

      if (!reportsResult.ok) {
        setError(reportsResult.error);
        setLoading(false);
        return;
      }

      if (!accountingResult.ok) {
        setError(accountingResult.error);
        setLoading(false);
        return;
      }

      setSummary(reportsResult.data);
      setAccounting(accountingResult.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportCsv = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', `${dateFrom}T00:00:00.000Z`);
    if (dateTo) params.set('dateTo', `${dateTo}T23:59:59.999Z`);
    window.open(`/api/accounting/export?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Reports</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Conversion, cycle time, revenue, AR register, and income ledger from live job data.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border border-[var(--topbar-border)] px-3 py-2 text-sm font-medium"
        >
          Export accounting CSV
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="field-input"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[var(--text-secondary)]">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="field-input"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setDateFrom('');
            setDateTo('');
          }}
          className="rounded-lg border border-[var(--topbar-border)] px-3 py-2 text-sm"
        >
          Clear dates
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-[var(--urgent)]">
          {error}
        </p>
      ) : null}

      {loading || !summary || !accounting ? (
        <p className="mt-8 text-sm text-[var(--text-secondary)]">Loading…</p>
      ) : (
        <div className="mt-8 space-y-6">
          <section className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-[var(--topbar-border)] bg-white p-5">
              <p className="text-xs uppercase text-[var(--text-secondary)]">Total revenue</p>
              <p className="mt-2 text-2xl font-semibold">${summary.totalRevenue.toFixed(2)}</p>
            </article>
            <article className="rounded-xl border border-[var(--topbar-border)] bg-white p-5">
              <p className="text-xs uppercase text-[var(--text-secondary)]">Unpaid balance</p>
              <p className="mt-2 text-2xl font-semibold">${summary.unpaidBalance.toFixed(2)}</p>
            </article>
            <article className="rounded-xl border border-[var(--topbar-border)] bg-white p-5">
              <p className="text-xs uppercase text-[var(--text-secondary)]">Avg cycle time</p>
              <p className="mt-2 text-2xl font-semibold">
                {summary.avgCycleDays != null ? `${summary.avgCycleDays} days` : '—'}
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {summary.archivedCount} archived jobs
              </p>
            </article>
          </section>

          <section className="rounded-xl border border-[var(--topbar-border)] bg-white p-5">
            <h2 className="font-semibold text-[var(--text-primary)]">AR aging</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-4">
              {(['current', '30', '60', '90+'] as const).map((bucket) => (
                <li key={bucket} className="rounded-lg bg-[var(--surface-rail)] px-3 py-2 text-sm">
                  <p className="text-[var(--text-secondary)]">
                    {bucket === 'current' ? 'Current' : `${bucket} days`}
                  </p>
                  <p className="font-semibold">${(accounting.arAging[bucket] ?? 0).toFixed(2)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-[var(--topbar-border)] bg-white p-5">
            <h2 className="font-semibold text-[var(--text-primary)]">AR register</h2>
            {accounting.arRegister.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      <th className="pb-2 pr-4 font-medium">Customer</th>
                      <th className="pb-2 pr-4 font-medium">Job</th>
                      <th className="pb-2 pr-4 font-medium">Balance</th>
                      <th className="pb-2 pr-4 font-medium">Due</th>
                      <th className="pb-2 font-medium">Aging</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounting.arRegister.map((row) => (
                      <tr key={row.invoiceId} className="border-b border-[var(--border-subtle)]">
                        <td className="py-2 pr-4">{row.customerName}</td>
                        <td className="py-2 pr-4">{row.cardTitle}</td>
                        <td className="py-2 pr-4">${row.balanceDue.toFixed(2)}</td>
                        <td className="py-2 pr-4">
                          {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-2">{row.agingBucket}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--text-secondary)]">No open receivables.</p>
            )}
          </section>

          <section className="rounded-xl border border-[var(--topbar-border)] bg-white p-5">
            <h2 className="font-semibold text-[var(--text-primary)]">Income ledger</h2>
            {accounting.transactions.length ? (
              <ul className="mt-4 space-y-2">
                {accounting.transactions.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <span>
                      {new Date(row.occurredAt).toLocaleDateString()} ·{' '}
                      {row.entryType === 'invoice_issued' ? 'Invoice issued' : 'Payment received'}
                    </span>
                    <span className="font-medium">${row.amount.toFixed(2)}</span>
                    <span className="w-full truncate text-[var(--text-secondary)]">
                      {row.description}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[var(--text-secondary)]">No ledger entries yet.</p>
            )}
          </section>

          <section className="rounded-xl border border-[var(--topbar-border)] bg-white p-5">
            <h2 className="font-semibold text-[var(--text-primary)]">Pipeline conversion</h2>
            <ul className="mt-4 space-y-2">
              {summary.conversionByColumn.map((row) => (
                <li key={row.stateKey} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{labelState(row.stateKey)}</span>
                  <span className="font-medium">{row.count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-[var(--topbar-border)] bg-white p-5">
            <h2 className="font-semibold text-[var(--text-primary)]">Revenue by job type</h2>
            <ul className="mt-4 space-y-2">
              {summary.revenueByJobType.length ? (
                summary.revenueByJobType.map((row) => (
                  <li key={row.jobType} className="flex items-center justify-between text-sm">
                    <span>{row.jobType}</span>
                    <span>
                      ${row.revenue.toFixed(2)} · {row.jobCount} jobs
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-[var(--text-secondary)]">No invoiced jobs yet.</li>
              )}
            </ul>
          </section>
        </div>
      )}
      <AiPageCopilot page="reports" />
    </main>
  );
}
