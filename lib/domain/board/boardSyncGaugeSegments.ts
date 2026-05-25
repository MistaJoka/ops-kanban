import type { BoardSyncStatus } from '@/lib/domain/board/boardSyncStatus';
import { totalPendingSyncCount } from '@/lib/domain/board/boardSyncStatus';

export type SyncGaugeSegmentKey = 'live' | 'server' | 'queue';

export type SyncGaugeSegmentState = 'idle' | 'confirmed' | 'active' | 'failed';

export type SyncGaugeSegment = {
  key: SyncGaugeSegmentKey;
  shortLabel: string;
  hint: string;
  state: SyncGaugeSegmentState;
};

export function syncSummaryLabel(status: BoardSyncStatus): string {
  const totalPending = totalPendingSyncCount(status);

  switch (status.phase) {
    case 'syncing':
      return totalPending > 1 ? `Saving · ${totalPending}` : 'Saving';
    case 'refreshing':
      return 'Updating';
    case 'misaligned':
      return 'Out of sync';
    default:
      return status.liveConnected ? 'Synced' : 'Live paused';
  }
}

export function deriveSyncGaugeSegments(status: BoardSyncStatus): SyncGaugeSegment[] {
  const totalPending = totalPendingSyncCount(status);

  const liveState: SyncGaugeSegmentState = status.liveConnected ? 'confirmed' : 'active';
  const liveHint = status.liveConnected
    ? 'Live updates connected.'
    : 'Live updates reconnecting.';

  let serverState: SyncGaugeSegmentState;
  let serverHint: string;
  if (status.phase === 'misaligned') {
    serverState = 'failed';
    serverHint = status.detail ?? 'Board could not be confirmed with the server.';
  } else if (status.phase === 'refreshing') {
    serverState = 'active';
    serverHint = 'Refreshing board data from the server.';
  } else {
    serverState = 'confirmed';
    serverHint = 'Board matches the server.';
  }

  let queueState: SyncGaugeSegmentState;
  let queueHint: string;
  if (status.phase === 'misaligned') {
    queueState = 'failed';
    queueHint = 'Outbound changes could not be saved.';
  } else if (totalPending > 0) {
    queueState = 'active';
    queueHint =
      totalPending > 1
        ? `${totalPending} changes saving to the server.`
        : 'Saving local changes to the server.';
  } else {
    queueState = 'idle';
    queueHint = 'No outbound changes waiting.';
  }

  return [
    { key: 'live', shortLabel: 'Live', hint: liveHint, state: liveState },
    { key: 'server', shortLabel: 'Server', hint: serverHint, state: serverState },
    { key: 'queue', shortLabel: 'Queue', hint: queueHint, state: queueState },
  ];
}

export function syncGaugeAriaLabel(
  status: BoardSyncStatus,
  segments: SyncGaugeSegment[],
  lastSynced: string | null,
): string {
  const summary = syncSummaryLabel(status);
  const stageDetail = segments.map((segment) => `${segment.shortLabel}: ${segment.hint}`).join(' ');
  const syncedAt = lastSynced ? ` Last confirmed ${lastSynced}.` : '';

  return `Sync status: ${summary}. ${stageDetail}${syncedAt}`;
}
