'use client';

import { useState } from 'react';

export function PortalActions({
  token,
  canApprove,
}: {
  token: string;
  canApprove: boolean;
}) {
  const [signerName, setSignerName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const approve = async () => {
    if (!signerName.trim()) {
      setMessage('Enter your name to approve.');
      return;
    }

    if (!accepted) {
      setMessage('Please confirm you approve this estimate.');
      return;
    }

    setPending(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/portal/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signerName: signerName.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Approval failed.');
      }
      setMessage(payload.data?.message ?? 'Estimate approved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Approval failed.');
    } finally {
      setPending(false);
    }
  };

  if (!canApprove) {
    return null;
  }

  return (
    <div className="mt-6 space-y-3">
      <input
        value={signerName}
        onChange={(event) => setSignerName(event.target.value)}
        placeholder="Your full name"
        className="field-input"
      />
      <label className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
        <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
        <span>I approve this estimate and authorize work to proceed at the listed total.</span>
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={() => void approve()}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? 'Submitting…' : 'Approve estimate'}
      </button>
      {message ? <p className="text-sm text-[var(--text-primary)]">{message}</p> : null}
    </div>
  );
}
