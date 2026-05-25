'use client';

import { useEffect, useRef } from 'react';

import type { RealtimeConnectionStatus } from '@/lib/domain/board/boardSyncStatus';
import { createClient } from '@/lib/db/supabase/client';

const REALTIME_DEBOUNCE_MS = 400;
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 30000;

export function useBoardRealtime(
  organizationId: string,
  onRefresh: () => void,
  options?: {
    shouldSkip?: () => boolean;
    onConnectionChange?: (status: RealtimeConnectionStatus) => void;
    onMissedEvent?: () => void;
  },
) {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const shouldSkipRef = useRef(options?.shouldSkip);
  shouldSkipRef.current = options?.shouldSkip;

  const onConnectionChangeRef = useRef(options?.onConnectionChange);
  onConnectionChangeRef.current = options?.onConnectionChange;

  const onMissedEventRef = useRef(options?.onMissedEvent);
  onMissedEventRef.current = options?.onMissedEvent;

  useEffect(() => {
    const supabase = createClient();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    let wasConnected = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let disposed = false;

    onConnectionChangeRef.current?.('connecting');

    const scheduleRefresh = () => {
      if (shouldSkipRef.current?.()) {
        onMissedEventRef.current?.();
        return;
      }

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        if (shouldSkipRef.current?.()) {
          onMissedEventRef.current?.();
          return;
        }
        onRefreshRef.current();
      }, REALTIME_DEBOUNCE_MS);
    };

    const subscribe = () => {
      if (disposed) return;

      channel = supabase
        .channel(`board-${organizationId}-${Date.now()}`)
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
            reconnectAttempts = 0;
            onConnectionChangeRef.current?.('connected');
            if (wasConnected) {
              scheduleRefresh();
            }
            wasConnected = true;
            return;
          }

          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            onConnectionChangeRef.current?.('disconnected');
            if (!disposed && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              const delay = Math.min(
                BASE_RECONNECT_MS * 2 ** reconnectAttempts,
                MAX_RECONNECT_MS,
              );
              reconnectAttempts += 1;
              reconnectTimer = setTimeout(() => {
                if (channel) {
                  void supabase.removeChannel(channel);
                }
                subscribe();
              }, delay);
            }
            return;
          }

          onConnectionChangeRef.current?.('connecting');
        });
    };

    subscribe();

    return () => {
      disposed = true;
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      onConnectionChangeRef.current?.('disconnected');
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [organizationId]);
}
