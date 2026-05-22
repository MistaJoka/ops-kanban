export type BoardSyncPhase = 'synced' | 'syncing' | 'refreshing' | 'misaligned';

export type BoardSyncStatus = {
  phase: BoardSyncPhase;
  pendingCount: number;
  lastSyncedAt: number | null;
  liveConnected: boolean;
  detail: string | null;
};

export type RealtimeConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export function deriveBoardSyncPhase(input: {
  pendingCount: number;
  isRefreshing: boolean;
  syncIssue: string | null;
}): BoardSyncPhase {
  if (input.syncIssue) {
    return 'misaligned';
  }

  if (input.isRefreshing) {
    return 'refreshing';
  }

  if (input.pendingCount > 0) {
    return 'syncing';
  }

  return 'synced';
}

export function buildBoardSyncStatus(input: {
  pendingCount: number;
  isRefreshing: boolean;
  syncIssue: string | null;
  lastSyncedAt: number | null;
  liveConnected: boolean;
}): BoardSyncStatus {
  return {
    phase: deriveBoardSyncPhase(input),
    pendingCount: input.pendingCount,
    lastSyncedAt: input.lastSyncedAt,
    liveConnected: input.liveConnected,
    detail: input.syncIssue,
  };
}

export function formatLastSyncedAt(timestamp: number | null): string | null {
  if (!timestamp) {
    return null;
  }

  const deltaSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (deltaSeconds < 5) {
    return 'just now';
  }
  if (deltaSeconds < 60) {
    return `${deltaSeconds}s ago`;
  }

  const minutes = Math.floor(deltaSeconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
