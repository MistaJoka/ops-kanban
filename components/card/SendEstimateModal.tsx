'use client';

import { useEffect, useState } from 'react';

export function SendEstimateModal({
  defaultEmail,
  pending = false,
  error = null,
  onClose,
  onSend,
}: {
  defaultEmail?: string | null;
  pending?: boolean;
  error?: string | null;
  onClose: () => void;
  onSend: (email: string) => void | Promise<void>;
}) {
  const [email, setEmail] = useState(defaultEmail ?? '');

  useEffect(() => {
    setEmail(defaultEmail ?? '');
  }, [defaultEmail]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) {
        onClose();
      }
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [onClose, pending]);

  const canSend = email.trim().length > 0;

  return (
    <div className="ops-modal-overlay" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-estimate-modal-title"
        className="ops-modal max-w-md"
      >
        <h2 id="send-estimate-modal-title" className="ops-modal-title">
          Email estimate
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Send the estimate with a customer portal link.
        </p>

        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSend) return;
            void onSend(email.trim());
          }}
        >
          <label className="block space-y-1.5">
            <span className="ops-field-label">Customer email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              autoFocus
              aria-label="Customer email"
              className="field-input"
              placeholder="customer@example.com"
            />
          </label>

          {error ? (
            <p role="alert" className="ops-alert-error text-sm">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" disabled={pending} onClick={onClose} className="ops-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={!canSend || pending} className="ops-btn-primary">
              {pending ? 'Sending…' : 'Send estimate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
