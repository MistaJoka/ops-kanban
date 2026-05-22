'use client';

import { useEffect, useState } from 'react';

import type { QuoteItemView, QuoteView } from '@/lib/domain/money/quotes';

type DraftLine = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

function toDraftItems(items: QuoteItemView[]): DraftLine[] {
  if (items.length === 0) {
    return [];
  }

  return items.map((item) => ({
    id: item.id,
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: String(item.unitPrice),
  }));
}

export function EstimateTab({
  quote,
  canManage,
  onSave,
  onMarkSent,
  onExport,
  onSend,
  onDraftFromAi,
  aiDraftLoading = false,
  saving,
}: {
  quote: QuoteView | null;
  canManage: boolean;
  onSave: (lineItems: Array<{ description: string; quantity: number; unitPrice: number }>) => Promise<void>;
  onMarkSent: () => Promise<void>;
  onExport?: () => void;
  onSend?: () => Promise<void>;
  onDraftFromAi?: () => Promise<void>;
  aiDraftLoading?: boolean;
  saving: boolean;
}) {
  const [lines, setLines] = useState<DraftLine[]>(() => toDraftItems(quote?.items ?? []));

  useEffect(() => {
    setLines(toDraftItems(quote?.items ?? []));
  }, [quote]);

  const previewTotal = lines.reduce((sum, line) => {
    const quantity = Number(line.quantity) || 0;
    const unitPrice = Number(line.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0);

  const addLine = () => {
    setLines((current) => [
      ...current,
      { id: crypto.randomUUID(), description: '', quantity: '1', unitPrice: '0' },
    ]);
  };

  const updateLine = (id: string, patch: Partial<DraftLine>) => {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  };

  const removeLine = (id: string) => {
    setLines((current) => {
      if (current.length <= 1) {
        return quote ? current : [];
      }
      return current.filter((line) => line.id !== id);
    });
  };

  const save = async () => {
    const lineItems = lines
      .filter((line) => line.description.trim())
      .map((line) => ({
        description: line.description.trim(),
        quantity: Number(line.quantity) || 0,
        unitPrice: Number(line.unitPrice) || 0,
      }));

    if (lineItems.length === 0) {
      return;
    }

    await onSave(lineItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Estimate</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {quote?.status === 'sent' ? 'Sent to customer' : 'Draft line items'}
          </p>
        </div>
        {quote ? (
          <span className="rounded-full bg-[var(--surface-rail)] px-3 py-1 text-sm font-medium">
            ${quote.total.toFixed(2)}
          </span>
        ) : null}
      </div>

      {!quote && lines.length === 0 ? (
        <p className="ops-empty-state text-sm">No estimate yet.</p>
      ) : null}

      <div className="space-y-3">
        {lines.map((line) => (
          <div key={line.id} className="ops-section-card grid gap-2 p-3 md:grid-cols-[1fr_80px_100px_auto]">
            <input
              value={line.description}
              disabled={!canManage || quote?.status === 'sent'}
              onChange={(event) => updateLine(line.id, { description: event.target.value })}
              placeholder="Description"
              className="field-input"
            />
            <input
              value={line.quantity}
              disabled={!canManage || quote?.status === 'sent'}
              onChange={(event) => updateLine(line.id, { quantity: event.target.value })}
              type="number"
              min="0"
              step="0.25"
              className="field-input"
              aria-label="Quantity"
            />
            <input
              value={line.unitPrice}
              disabled={!canManage || quote?.status === 'sent'}
              onChange={(event) => updateLine(line.id, { unitPrice: event.target.value })}
              type="number"
              min="0"
              step="0.01"
              className="field-input"
              aria-label="Unit price"
            />
            {canManage && quote?.status !== 'sent' ? (
              <button
                type="button"
                onClick={() => removeLine(line.id)}
                className="ops-icon-btn"
                aria-label="Remove line"
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {canManage && quote?.status !== 'sent' ? (
        <div className="flex flex-wrap gap-2">
          {onDraftFromAi ? (
            <button
              type="button"
              disabled={saving || aiDraftLoading}
              onClick={() => void onDraftFromAi()}
              className="ops-btn-accent-outline"
            >
              {aiDraftLoading ? 'Drafting…' : 'Draft from scope (AI)'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={addLine}
            className="ops-btn-secondary"
          >
            Add line
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="ops-btn-primary"
          >
            Save estimate
          </button>
          {quote && quote.total > 0 ? (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => void onMarkSent()}
                className="ops-btn-accent-outline"
              >
                Mark sent
              </button>
              {onExport ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={onExport}
                  className="ops-btn-secondary"
                >
                  Download HTML
                </button>
              ) : null}
              {onSend ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void onSend()}
                  className="ops-btn-secondary"
                >
                  Email with portal link
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      {lines.length > 0 || quote ? (
        <div className="rounded-xl bg-[var(--surface-rail)] px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Preview total</span>
            <span className="font-semibold tabular-nums text-[var(--text-primary)]">
              ${previewTotal.toFixed(2)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
