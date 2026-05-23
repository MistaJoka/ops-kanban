import { describe, expect, it, vi } from 'vitest';

import {
  buildBoardSyncStatus,
  deriveBoardSyncPhase,
  formatLastSyncedAt,
} from '@/lib/domain/board/boardSyncStatus';

describe('boardSyncStatus', () => {
  it('derives phase priority: misaligned over refreshing over syncing', () => {
    expect(
      deriveBoardSyncPhase({
        pendingCount: 2,
        queuedCount: 0,
        isRefreshing: true,
        syncIssue: 'Failed',
      }),
    ).toBe('misaligned');
    expect(
      deriveBoardSyncPhase({
        pendingCount: 0,
        queuedCount: 0,
        isRefreshing: true,
        syncIssue: null,
      }),
    ).toBe('refreshing');
    expect(
      deriveBoardSyncPhase({
        pendingCount: 1,
        queuedCount: 0,
        isRefreshing: false,
        syncIssue: null,
      }),
    ).toBe('syncing');
    expect(
      deriveBoardSyncPhase({
        pendingCount: 0,
        queuedCount: 2,
        isRefreshing: false,
        syncIssue: null,
      }),
    ).toBe('syncing');
    expect(
      deriveBoardSyncPhase({
        pendingCount: 0,
        queuedCount: 0,
        isRefreshing: false,
        syncIssue: null,
      }),
    ).toBe('synced');
  });

  it('builds status payload with live connection flag', () => {
    const status = buildBoardSyncStatus({
      pendingCount: 0,
      queuedCount: 0,
      isRefreshing: false,
      syncIssue: null,
      lastSyncedAt: Date.now(),
      liveConnected: false,
    });

    expect(status.phase).toBe('synced');
    expect(status.liveConnected).toBe(false);
  });

  it('formats recent sync timestamps', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-22T12:00:10.000Z'));

    expect(formatLastSyncedAt(Date.now() - 2_000)).toBe('just now');
    expect(formatLastSyncedAt(Date.now() - 30_000)).toBe('30s ago');
    expect(formatLastSyncedAt(Date.now() - 120_000)).toBe('2m ago');

    vi.useRealTimers();
  });
});
