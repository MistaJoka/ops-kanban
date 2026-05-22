'use client';

import { useEffect, useRef } from 'react';

import type { RealtimeConnectionStatus } from '@/lib/domain/board/boardSyncStatus';
import { createClient } from '@/lib/db/supabase/client';

const REALTIME_DEBOUNCE_MS = 400;

export function useBoardRealtime(
  organizationId: string,
  onRefresh: () => void,
  options?: {
    shouldSkip?: () => boolean;
    onConnectionChange?: (status: RealtimeConnectionStatus) => void;
  },
) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const shouldSkipRef = useRef(options?.shouldSkip);
  shouldSkipRef.current = options?.shouldSkip;

  const onConnectionChangeRef = useRef(options?.onConnectionChange);
  onConnectionChangeRef.current = options?.onConnectionChange;

  useEffect(() => {
    const supabase = createClient();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    onConnectionChangeRef.current?.('connecting');

    const scheduleRefresh = () => {
      if (shouldSkipRef.current?.()) {
        return;
      }

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        if (shouldSkipRef.current?.()) {
          return;
        }
        onRefreshRef.current();
      }, REALTIME_DEBOUNCE_MS);
    };

    const channel = supabase
      .channel(`board-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
          filter: `organization_id=eq.${organizationId}`,
        },
        scheduleRefresh,
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          onConnectionChangeRef.current?.('connected');
          return;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          onConnectionChangeRef.current?.('disconnected');
          return;
        }

        onConnectionChangeRef.current?.('connecting');
      });

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      onConnectionChangeRef.current?.('disconnected');
      void supabase.removeChannel(channel);
    };
  }, [organizationId]);
}
