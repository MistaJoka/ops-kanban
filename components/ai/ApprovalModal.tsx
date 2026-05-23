'use client';

import { useState } from 'react';

import type { AiClientContext } from '@/components/ai/AiDock';

export function ApprovalModal({
  toolCallId,
  toolName,
  preview,
  context,
  onClose,
  onComplete,
}: {
  toolCallId: string;
  toolName: string;
  preview: { summary: string; input: Record<string, unknown>; details?: string[] };
  context: AiClientContext;
  onClose: () => void;
  onComplete: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHighRisk =
    toolName === 'markInvoicePaid' ||
    toolName === 'archiveCard' ||
    toolName === 'createPaymentLink';

  const approve = async () => {
    if (isHighRisk && !confirmed) {
      setError('Confirm this high-risk action before approving.');
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolCallId, context }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Approval failed.');
      }
      onComplete(payload.data?.message ?? 'Action approved and executed.');
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'Approval failed.');
    } finally {
      setPending(false);
    }
  };

  const reject = async () => {
    setPending(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolCallId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Reject failed.');
      }
      onComplete('Action rejected.');
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : 'Reject failed.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="ops-modal-overlay" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-modal-title"
        className="ops-modal max-w-lg"
      >
        <h2 id="approval-modal-title" className="ops-modal-title">
          Approve AI action
        </h2>
        <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{preview.summary}</p>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          Tool: <span className="font-mono">{toolName}</span>
        </p>

        {preview.details?.length ? (
          <ul className="mt-4 space-y-1.5 rounded-[var(--radius-control)] bg-[var(--surface-inset)] p-3 text-sm text-[var(--text-secondary)]">
            {preview.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        ) : null}

        {isHighRisk ? (
          <label className="mt-4 flex items-start gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5"
            />
            <span>I confirm this {toolName === 'markInvoicePaid' ? 'payment' : toolName === 'createPaymentLink' ? 'payment link' : 'archive'} action.</span>
          </label>
        ) : null}

        {error ? (
          <p role="alert" aria-live="assertive" className="ops-alert-error mt-3">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={pending} className="ops-btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={() => void reject()} disabled={pending} className="ops-btn-secondary">
            Reject
          </button>
          <button type="button" onClick={() => void approve()} disabled={pending} className="ops-btn-primary">
            Approve & run
          </button>
        </div>
      </div>
    </div>
  );
}
