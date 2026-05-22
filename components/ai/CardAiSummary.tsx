'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

import type { AiClientContext } from '@/components/ai/AiDock';

export function CardAiSummary({
  context,
  cardTitle,
}: {
  context: AiClientContext;
  cardTitle: string;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    if (!context.userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'Summarize this job',
          context: {
            ...context,
            page: 'card',
            selectedCardId: context.selectedCardId,
            mode: 'analyze',
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Summary failed.');
      }

      setSummary(payload.data?.message ?? 'No summary available.');
    } catch (summaryError) {
      setError(summaryError instanceof Error ? summaryError.message : 'Summary failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, [context.selectedCardId, context.userId]);

  return (
    <div
      className="rounded-xl border bg-[var(--surface-rail)] p-4"
      style={{
        borderColor: 'var(--topbar-border)',
        boxShadow: 'var(--shadow-card)',
      }}
      data-testid="card-ai-summary"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-[var(--accent)]" strokeWidth={2.25} />
          <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            AI summary
          </h3>
        </div>
        <button
          type="button"
          onClick={() => void loadSummary()}
          disabled={loading}
          className="text-xs font-medium text-[var(--accent)] hover:underline disabled:opacity-60"
        >
          Refresh
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">Summarizing {cardTitle}…</p>
      ) : error ? (
        <p className="text-sm text-[var(--urgent)]">{error}</p>
      ) : (
        <p className="text-sm text-[var(--text-primary)]">{summary}</p>
      )}
    </div>
  );
}
