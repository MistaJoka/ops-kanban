'use client';

export function AiInlineBanner({
  message,
  actionLabel,
  onAction,
  onDismiss,
}: {
  message: string;
  actionLabel: string;
  onAction: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border bg-[var(--accent-muted)] px-3 py-2 text-sm text-[var(--text-primary)]"
      style={{ borderColor: 'var(--topbar-border)' }}
      role="status"
    >
      <span>{message}</span>
      <div className="flex gap-2">
        {onDismiss ? (
          <button type="button" onClick={onDismiss} className="ops-btn-secondary text-xs">
            Dismiss
          </button>
        ) : null}
        <button type="button" onClick={onAction} className="ops-btn-primary text-xs">
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
