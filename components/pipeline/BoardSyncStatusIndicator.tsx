'use client';

import type { BoardSyncStatus } from '@/lib/domain/board/boardSyncStatus';
import { formatLastSyncedAt } from '@/lib/domain/board/boardSyncStatus';
import {
  deriveSyncGaugeSegments,
  syncGaugeAriaLabel,
  syncSummaryLabel,
} from '@/lib/domain/board/boardSyncGaugeSegments';
import { cn } from '@/lib/utils';

export function BoardSyncStatusIndicator({
  status,
  onRetry,
}: {
  status: BoardSyncStatus;
  onRetry?: () => void;
}) {
  const lastSynced = formatLastSyncedAt(status.lastSyncedAt);
  const segments = deriveSyncGaugeSegments(status);
  const summary = syncSummaryLabel(status);
  const ariaLabel = syncGaugeAriaLabel(status, segments, lastSynced);
  const tooltip = `${segments.map((segment) => `${segment.shortLabel} — ${segment.hint}`).join(' ')}${
    lastSynced ? ` Last confirmed ${lastSynced}.` : ''
  }`;

  return (
    <div
      className={cn('ops-sync-gauge', `ops-sync-gauge--${status.phase}`)}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      title={tooltip}
      data-sync-phase={status.phase}
    >
      <div className="ops-sync-gauge__track" aria-hidden>
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={cn(
              'ops-sync-gauge__segment',
              `ops-sync-gauge__segment--${segment.key}`,
              `ops-sync-gauge__segment--${segment.state}`,
            )}
            title={`${segment.shortLabel}: ${segment.hint}`}
          />
        ))}
      </div>

      <span className="ops-sync-gauge__label">{summary}</span>

      {status.phase === 'misaligned' && onRetry ? (
        <button type="button" className="ops-sync-gauge__retry" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
