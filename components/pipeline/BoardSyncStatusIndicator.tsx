'use client';

import { AlertCircle, Check, Loader2, RefreshCw } from 'lucide-react';

import type { BoardSyncStatus } from '@/lib/domain/board/boardSyncStatus';
import { formatLastSyncedAt, totalPendingSyncCount } from '@/lib/domain/board/boardSyncStatus';
import { cn } from '@/lib/utils';

function syncLabel(status: BoardSyncStatus): string {
  const totalPending = totalPendingSyncCount(status);

  switch (status.phase) {
    case 'syncing':
      return totalPending > 1 ? `Saving · ${totalPending} pending` : 'Saving…';
    case 'refreshing':
      return 'Updating…';
    case 'misaligned':
      return 'Out of sync';
    default:
      return status.liveConnected ? 'Synced' : 'Synced · live paused';
  }
}

function syncHint(status: BoardSyncStatus): string {
  switch (status.phase) {
    case 'syncing':
      return 'Local changes are being saved to the server.';
    case 'refreshing':
      return 'Refreshing board data from the server.';
    case 'misaligned':
      return status.detail ?? 'A change could not be saved. The board was restored.';
    default:
      if (!status.liveConnected) {
        return 'Board matches the server. Live updates are reconnecting.';
      }
      return 'Board matches the server.';
  }
}

export function BoardSyncStatusIndicator({
  status,
  onRetry,
}: {
  status: BoardSyncStatus;
  onRetry?: () => void;
}) {
  const lastSynced = formatLastSyncedAt(status.lastSyncedAt);
  const label = syncLabel(status);
  const hint = syncHint(status);
  const isActive = status.phase === 'syncing' || status.phase === 'refreshing';

  return (
    <div
      className={cn('ops-sync-status', `ops-sync-status--${status.phase}`)}
      role="status"
      aria-live="polite"
      aria-label={`Sync status: ${label}. ${hint}${lastSynced ? ` Last confirmed ${lastSynced}.` : ''}`}
      title={`${hint}${lastSynced ? ` Last confirmed ${lastSynced}.` : ''}`}
    >
      <span className="ops-sync-status__icon" aria-hidden>
        {status.phase === 'misaligned' ? (
          <AlertCircle className="size-3.5" strokeWidth={2.25} />
        ) : status.phase === 'refreshing' ? (
          <RefreshCw className="size-3.5 animate-spin" strokeWidth={2.25} />
        ) : isActive ? (
          <Loader2 className="size-3.5 animate-spin" strokeWidth={2.25} />
        ) : (
          <Check className="size-3.5" strokeWidth={2.5} />
        )}
      </span>
      <span className="ops-sync-status__label">{label}</span>
      {status.phase === 'misaligned' && onRetry ? (
        <button
          type="button"
          className="ops-sync-status__retry"
          onClick={onRetry}
        >
          Retry
        </button>
      ) : null}
      {lastSynced && status.phase === 'synced' ? (
        <span className="ops-sync-status__meta">{lastSynced}</span>
      ) : null}
    </div>
  );
}
