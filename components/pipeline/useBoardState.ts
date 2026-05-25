'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import type { BoardView } from '@/lib/domain/board/getBoard';
import { buildBoardSyncStatus, type BoardSyncStatus } from '@/lib/domain/board/boardSyncStatus';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import type { CardDetailView } from '@/lib/domain/cards/cardDetail';
import {
  applyBoardCardPatch,
  boardCardFromDetail,
  removeBoardCardById,
  replaceBoardCard,
  sortBoardCards,
} from '@/lib/domain/board/boardOptimistic';
import type { OutboundMutation } from '@/lib/domain/board/outboundSyncQueue';
import {
  isOutboundQueueEnabled,
  useOutboundSync,
  type EnqueueSidecar,
  type SyncFailureEvent,
} from '@/components/pipeline/useOutboundSync';
import {
  createReapplyFailedMutation,
  useBoardMutations,
} from '@/components/pipeline/sync/useBoardMutations';

export type MoveCardResult =
  | { ok: true; card: BoardCardView }
  | { ok: false; code?: string; message: string };

export type ReorderCardResult = MoveCardResult;

export type CreateCardDetails = {
  title: string;
  columnId?: string;
  jobType?: string;
  customerName?: string;
  customerAddress?: string;
};

export type CreateCardWithDetailsResult =
  | { ok: true; card: BoardCardView }
  | { ok: false; message: string };

export type BoardSyncHandlers = {
  upsertCard: (card: BoardCardView) => void;
  patchCard: (cardId: string, patch: Partial<BoardCardView>) => void;
  removeCard: (cardId: string) => void;
  syncFromDetail: (detail: CardDetailView) => void;
  beginOutboundSync: () => void;
  endOutboundSync: (success: boolean, message?: string) => void;
  enqueue: (mutation: OutboundMutation, sidecar?: EnqueueSidecar) => void;
  flush: (cardId?: string) => void;
  retryFailed: () => boolean;
  hasPendingForCard: (cardId: string) => boolean;
  retryFailedSync: () => boolean;
  subscribeFailures: (listener: (event: SyncFailureEvent) => void) => () => void;
  getBoardSnapshot: () => BoardCardView[];
  queueEnabled: boolean;
};

export function useBoardState(initialBoard: BoardView) {
  const [board, setBoard] = useState<BoardView>(() => ({
    ...initialBoard,
    cards: sortBoardCards(initialBoard.cards),
  }));
  const [error, setError] = useState<string | null>(null);
  const [pipelineModePending, setPipelineModePending] = useState(false);
  const [pendingMutationCount, setPendingMutationCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncIssue, setSyncIssue] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(() => Date.now());
  const [liveConnected, setLiveConnected] = useState(false);
  const pendingCatchUpRef = useRef(false);
  const queueEnabled = isOutboundQueueEnabled();

  const boardRef = useRef(board);
  boardRef.current = board;

  const mutationCountRef = useRef(0);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncIssueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markSynced = useCallback(() => {
    setLastSyncedAt(Date.now());
    setSyncIssue(null);
  }, []);

  const beginMutation = useCallback(() => {
    mutationCountRef.current += 1;
    setPendingMutationCount(mutationCountRef.current);
    setSyncIssue(null);
  }, []);

  const endMutation = useCallback(
    (success: boolean, message?: string) => {
      mutationCountRef.current = Math.max(0, mutationCountRef.current - 1);
      setPendingMutationCount(mutationCountRef.current);

      if (success) {
        markSynced();
        return;
      }

      if (message) {
        setSyncIssue(message);
        if (syncIssueTimerRef.current) {
          clearTimeout(syncIssueTimerRef.current);
        }
        syncIssueTimerRef.current = setTimeout(() => {
          setSyncIssue(null);
        }, 8000);
      }
    },
    [markSynced],
  );

  const showError = useCallback((message: string) => {
    setError(message);
    setSyncIssue(message);
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }
    errorTimerRef.current = setTimeout(() => {
      setError(null);
    }, 5000);
    if (syncIssueTimerRef.current) {
      clearTimeout(syncIssueTimerRef.current);
    }
    syncIssueTimerRef.current = setTimeout(() => {
      setSyncIssue(null);
    }, 8000);
  }, []);

  const restoreBoard = useCallback((cards: BoardCardView[]) => {
    setBoard((current) => ({ ...current, cards: sortBoardCards(cards) }));
  }, []);

  const reconcileBoardCard = useCallback((cardId: string, card: BoardCardView) => {
    setBoard((current) => ({
      ...current,
      cards: replaceBoardCard(current.cards, cardId, card),
    }));
  }, []);

  const replaceTempCard = useCallback((tempId: string, card: BoardCardView) => {
    setBoard((current) => ({
      ...current,
      cards: replaceBoardCard(removeBoardCardById(current.cards, tempId), card.id, card),
    }));
  }, []);

  const reconcileDetail = useCallback((detail: CardDetailView) => {
    setBoard((current) => {
      const existing = current.cards.find((item) => item.id === detail.id);
      const next = boardCardFromDetail(detail, existing);
      return {
        ...current,
        cards: replaceBoardCard(current.cards, detail.id, next),
      };
    });
  }, []);

  const refreshBoard = useCallback(
    async (includeArchived = false) => {
      setIsRefreshing(true);
      try {
        const response = await fetch(
          includeArchived ? '/api/board?includeArchived=true' : '/api/board',
        );
        const payload = await response.json();
        if (response.ok) {
          setBoard({
            ...payload.data,
            cards: sortBoardCards(payload.data.cards),
          });
          markSynced();
        } else {
          showError(payload.error ?? 'Failed to refresh board.');
        }
      } catch (refreshError) {
        showError(
          refreshError instanceof Error ? refreshError.message : 'Failed to refresh board.',
        );
      } finally {
        setIsRefreshing(false);
      }
    },
    [markSynced, showError],
  );

  const upsertCard = useCallback((card: BoardCardView) => {
    setBoard((current) => ({
      ...current,
      cards: replaceBoardCard(current.cards, card.id, card),
    }));
  }, []);

  const patchCard = useCallback((cardId: string, patch: Partial<BoardCardView>) => {
    setBoard((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.id === cardId ? applyBoardCardPatch(card, patch) : card,
      ),
    }));
  }, []);

  const removeCard = useCallback((cardId: string) => {
    setBoard((current) => ({
      ...current,
      cards: removeBoardCardById(current.cards, cardId),
    }));
  }, []);

  const syncFromDetail = useCallback((detail: CardDetailView) => {
    setBoard((current) => {
      const existing = current.cards.find((card) => card.id === detail.id);
      const next = boardCardFromDetail(detail, existing);
      return {
        ...current,
        cards: replaceBoardCard(current.cards, detail.id, next),
      };
    });
  }, []);

  const reapplyFailedMutation = useCallback(
    createReapplyFailedMutation({
      getBoard: () => boardRef.current,
      upsertCard,
      patchCard,
      removeCard,
      restoreBoard,
    }),
    [patchCard, removeCard, restoreBoard, upsertCard],
  );

  const outboundSync = useOutboundSync({
    restoreBoard,
    reconcileBoardCard,
    reconcileDetail,
    replaceTempCard,
    reapplyFailedMutation,
    onSyncSuccess: markSynced,
    onSyncFailure: showError,
    onDrain: () => {
      if (pendingCatchUpRef.current) {
        pendingCatchUpRef.current = false;
        void refreshBoard();
      }
    },
  });

  const hasPendingMutations = useCallback(() => {
    if (queueEnabled) {
      return outboundSync.hasWork();
    }
    return mutationCountRef.current > 0;
  }, [outboundSync, queueEnabled]);

  const beginOutboundSync = useCallback(() => {
    if (!queueEnabled) {
      beginMutation();
    }
  }, [beginMutation, queueEnabled]);

  const endOutboundSync = useCallback(
    (success: boolean, message?: string) => {
      if (!queueEnabled) {
        endMutation(success, message);
      } else if (!success && message) {
        showError(message);
      } else if (success) {
        markSynced();
      }
    },
    [endMutation, markSynced, queueEnabled, showError],
  );

  const clearSyncIssue = useCallback(() => {
    if (syncIssueTimerRef.current) {
      clearTimeout(syncIssueTimerRef.current);
      syncIssueTimerRef.current = null;
    }
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    setSyncIssue(null);
    setError(null);
  }, []);

  const retryFailedSync = useCallback(() => {
    clearSyncIssue();

    if (queueEnabled && outboundSync.retryFailed()) {
      return true;
    }

    void refreshBoard();
    return true;
  }, [clearSyncIssue, outboundSync, queueEnabled, refreshBoard]);

  const boardSync: BoardSyncHandlers = {
    upsertCard,
    patchCard,
    removeCard,
    syncFromDetail,
    beginOutboundSync,
    endOutboundSync,
    enqueue: outboundSync.enqueue,
    flush: outboundSync.flush,
    retryFailed: outboundSync.retryFailed,
    hasPendingForCard: outboundSync.hasPendingForCard,
    retryFailedSync,
    subscribeFailures: outboundSync.subscribeFailures,
    getBoardSnapshot: () => boardRef.current.cards,
    queueEnabled,
  };

  const syncStatus: BoardSyncStatus = useMemo(
    () =>
      buildBoardSyncStatus({
        pendingCount: queueEnabled ? outboundSync.inFlightCount : pendingMutationCount,
        queuedCount: queueEnabled ? outboundSync.queuedCount : 0,
        isRefreshing,
        syncIssue,
        lastSyncedAt,
        liveConnected,
      }),
    [
      queueEnabled,
      outboundSync.inFlightCount,
      outboundSync.queuedCount,
      pendingMutationCount,
      isRefreshing,
      syncIssue,
      lastSyncedAt,
      liveConnected,
    ],
  );

  const { createCardWithDetails, moveCard, reorderCard, togglePipelineMode } = useBoardMutations({
    boardRef,
    setBoard,
    upsertCard,
    syncFromDetail,
    queueEnabled,
    outboundSync,
    beginMutation,
    endMutation,
    showError,
    refreshBoard,
    setPipelineModePending,
    setError,
  });

  return {
    board,
    error,
    pipelineModePending,
    syncStatus,
    refreshBoard,
    createCardWithDetails,
    moveCard,
    reorderCard,
    togglePipelineMode,
    boardSync,
    hasPendingMutations,
    setLiveConnected,
    markPendingCatchUp: () => {
      pendingCatchUpRef.current = true;
    },
  };
}
