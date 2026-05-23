'use client';

import { cn } from '@/lib/utils';

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  pending = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  pending?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  return (
    <div className="ops-modal-overlay" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="ops-modal max-w-md"
      >
        <h2 id="confirm-modal-title" className="ops-modal-title">
          {title}
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="ops-btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void onConfirm()}
            className={cn(
              confirmVariant === 'danger'
                ? 'rounded-lg bg-[var(--urgent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60'
                : 'ops-btn-primary',
            )}
          >
            {pending ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
