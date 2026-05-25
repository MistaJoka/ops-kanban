import { describe, expect, it } from 'vitest';

import { buildBoardSyncStatus } from '@/lib/domain/board/boardSyncStatus';
import {
  deriveSyncGaugeSegments,
  syncGaugeAriaLabel,
  syncSummaryLabel,
} from '@/lib/domain/board/boardSyncGaugeSegments';

describe('boardSyncGaugeSegments', () => {
  it('maps all-green segments when fully synced and live', () => {
    const status = buildBoardSyncStatus({
      pendingCount: 0,
      queuedCount: 0,
      isRefreshing: false,
      syncIssue: null,
      lastSyncedAt: Date.now(),
      liveConnected: true,
    });

    const segments = deriveSyncGaugeSegments(status);
    expect(segments.map((segment) => segment.state)).toEqual(['confirmed', 'confirmed', 'idle']);
    expect(syncSummaryLabel(status)).toBe('Synced');
  });

  it('shows live paused and refreshing server states independently', () => {
    const status = buildBoardSyncStatus({
      pendingCount: 0,
      queuedCount: 0,
      isRefreshing: true,
      syncIssue: null,
      lastSyncedAt: Date.now(),
      liveConnected: false,
    });

    const segments = deriveSyncGaugeSegments(status);
    expect(segments.find((segment) => segment.key === 'live')?.state).toBe('active');
    expect(segments.find((segment) => segment.key === 'server')?.state).toBe('active');
    expect(segments.find((segment) => segment.key === 'queue')?.state).toBe('idle');
    expect(syncSummaryLabel(status)).toBe('Updating');
  });

  it('shows queue active while saving', () => {
    const status = buildBoardSyncStatus({
      pendingCount: 2,
      queuedCount: 1,
      isRefreshing: false,
      syncIssue: null,
      lastSyncedAt: Date.now(),
      liveConnected: true,
    });

    const segments = deriveSyncGaugeSegments(status);
    expect(segments.find((segment) => segment.key === 'queue')?.state).toBe('active');
    expect(syncSummaryLabel(status)).toBe('Saving · 3');
  });

  it('marks server and queue failed when misaligned', () => {
    const status = buildBoardSyncStatus({
      pendingCount: 1,
      queuedCount: 0,
      isRefreshing: false,
      syncIssue: 'Move failed',
      lastSyncedAt: Date.now(),
      liveConnected: true,
    });

    const segments = deriveSyncGaugeSegments(status);
    expect(segments.find((segment) => segment.key === 'server')?.state).toBe('failed');
    expect(segments.find((segment) => segment.key === 'queue')?.state).toBe('failed');
    expect(syncSummaryLabel(status)).toBe('Out of sync');
  });

  it('builds an aria label with stage detail', () => {
    const status = buildBoardSyncStatus({
      pendingCount: 0,
      queuedCount: 0,
      isRefreshing: false,
      syncIssue: null,
      lastSyncedAt: Date.now(),
      liveConnected: true,
    });
    const segments = deriveSyncGaugeSegments(status);

    expect(syncGaugeAriaLabel(status, segments, 'just now')).toMatch(/Sync status: Synced\./);
    expect(syncGaugeAriaLabel(status, segments, 'just now')).toMatch(/Live: Live updates connected\./);
  });
});
