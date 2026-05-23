'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import type { BoardView } from '@/lib/domain/board/getBoard';
import {
  buildBoardSyncStatus,
  type BoardSyncStatus,
} from '@/lib/domain/board/boardSyncStatus';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import type { CardDetailView } from '@/lib/domain/cards/cardDetail';
import {
  applyBoardCardPatch,
  boardCardFromDetail,
  boardCardMovePatch,
  createOptimisticBoardCard,
  isTempCardId,
  nextCardPosition,
  removeBoardCardById,
  reorderBoardCards,
  replaceBoardCard,
  sortBoardCards,
  tempCardId,
} from '@/lib/domain/board/boardOptimistic';
import type { OutboundMutation } from '@/lib/domain/board/outboundSyncQueue';
import {
  createClientMutationId,
  isOutboundQueueEnabled,
  useOutboundSync,
  type EnqueueSidecar,
  type SyncFailureEvent,
} from '@/components/pipeline/useOutboundSync';

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
  const [liveConnected, setLiveConnected] = useState(true);
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

  const endMutation = useCallback((success: boolean, message?: string) => {
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
  }, [markSynced]);

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

  const refreshBoard = useCallback(async (includeArchived = false) => {
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
      showError(refreshError instanceof Error ? refreshError.message : 'Failed to refresh board.');
    } finally {
      setIsRefreshing(false);
    }
  }, [markSynced, showError]);

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
    (mutation: OutboundMutation) => {
      const currentBoard = boardRef.current;

      switch (mutation.kind) {
        case 'createCard': {
          const targetColumn = currentBoard.columns.find(
            (column) => column.id === mutation.body.columnId,
          );
          if (!targetColumn) {
            return;
          }

          upsertCard(
            createOptimisticBoardCard({
              id: mutation.clientId,
              title: mutation.body.title,
              columnId: mutation.body.columnId,
              stateKey: targetColumn.stateKey,
              position: nextCardPosition(currentBoard.cards, mutation.body.columnId),
            }),
          );
          break;
        }
        case 'moveCard': {
          const card = currentBoard.cards.find((item) => item.id === mutation.cardId);
          const targetColumn = currentBoard.columns.find(
            (column) => column.id === mutation.targetColumnId,
          );
          if (!card || !targetColumn) {
            return;
          }

          upsertCard(boardCardMovePatch(card, targetColumn));
          break;
        }
        case 'reorderCard':
          restoreBoard(
            reorderBoardCards(
              currentBoard.cards,
              mutation.cardId,
              mutation.targetColumnId,
              mutation.insertIndex,
              currentBoard.columns,
            ),
          );
          break;
        case 'patchCard': {
          const patch: Partial<BoardCardView> = {};
          if (mutation.patch.title !== undefined) {
            patch.title = String(mutation.patch.title);
          }
          if (mutation.patch.dueDate !== undefined) {
            patch.dueDate =
              mutation.patch.dueDate === null ? null : String(mutation.patch.dueDate);
          }
          if (mutation.patch.assignedTo !== undefined) {
            patch.assignedTo =
              mutation.patch.assignedTo === null ? null : String(mutation.patch.assignedTo);
          }
          if (Object.keys(patch).length > 0) {
            patchCard(mutation.cardId, patch);
          }
          break;
        }
        case 'deleteCard':
          removeCard(mutation.cardId);
          break;
        default:
          break;
      }
    },
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

  const createCardWithDetails = useCallback(
    async (details: CreateCardDetails): Promise<CreateCardWithDetailsResult> => {
      const title = details.title.trim();
      if (!title) {
        return { ok: false, message: 'Title is required.' };
      }

      const currentBoard = boardRef.current;
      const targetColumnId =
        details.columnId ??
        currentBoard.columns.find((column) => column.stateKey === 'inquiry')?.id ??
        currentBoard.columns[0]?.id;

      if (!targetColumnId) {
        const message = 'No column available for new jobs.';
        showError(message);
        return { ok: false, message };
      }

      const targetColumn = currentBoard.columns.find((column) => column.id === targetColumnId);
      if (!targetColumn) {
        const message = 'Column not found.';
        showError(message);
        return { ok: false, message };
      }

      const optimisticId = tempCardId();
      const optimisticCard = createOptimisticBoardCard({
        id: optimisticId,
        title,
        columnId: targetColumnId,
        stateKey: targetColumn.stateKey,
        position: nextCardPosition(currentBoard.cards, targetColumnId),
      });

      const previousCards = currentBoard.cards;
      upsertCard(optimisticCard);

      if (queueEnabled) {
        outboundSync.enqueue({
          kind: 'createCard',
          clientMutationId: createClientMutationId(),
          clientId: optimisticId,
          body: {
            title,
            columnId: targetColumnId,
            jobType: details.jobType,
            customerName: details.customerName,
            customerAddress: details.customerAddress,
          },
          rollback: { cards: previousCards },
        });
        return { ok: true, card: optimisticCard };
      }

      beginMutation();

      try {
        const response = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            columnId: targetColumnId,
            ...(details.jobType ? { jobType: details.jobType } : {}),
          }),
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to create card.');
        }

        let createdCard = payload.data as BoardCardView;

        if (details.customerName?.trim()) {
          const customerResponse = await fetch(`/api/cards/${createdCard.id}/customer`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: details.customerName.trim(),
              address: details.customerAddress?.trim() || null,
            }),
          });
          const customerPayload = await customerResponse.json();

          if (customerResponse.ok) {
            syncFromDetail(customerPayload.data);
            createdCard = boardCardFromDetail(customerPayload.data, createdCard);
          } else {
            showError(customerPayload.error ?? 'Job created but customer save failed.');
          }
        }

        setBoard((current) => ({
          ...current,
          cards: replaceBoardCard(
            removeBoardCardById(current.cards, optimisticId),
            createdCard.id,
            createdCard,
          ),
        }));
        endMutation(true);
        return { ok: true, card: createdCard };
      } catch (createError) {
        setBoard((current) => ({ ...current, cards: previousCards }));
        const message = createError instanceof Error ? createError.message : 'Failed to create card.';
        showError(message);
        endMutation(false, message);
        return { ok: false, message };
      }
    },
    [
      beginMutation,
      endMutation,
      outboundSync,
      queueEnabled,
      showError,
      syncFromDetail,
      upsertCard,
    ],
  );

  const moveCard = useCallback(
    async (
      cardId: string,
      targetColumnId: string,
      extras?: { reason?: string },
      sidecar?: EnqueueSidecar,
    ): Promise<MoveCardResult> => {
      const currentBoard = boardRef.current;
      const card = currentBoard.cards.find((item) => item.id === cardId);
      if (!card || card.columnId === targetColumnId || isTempCardId(cardId)) {
        return { ok: true, card: card ?? ({} as BoardCardView) };
      }

      const targetColumn = currentBoard.columns.find((column) => column.id === targetColumnId);
      if (!targetColumn) {
        return { ok: false, message: 'Target column not found.' };
      }

      const previousCards = currentBoard.cards;
      const optimisticCard = boardCardMovePatch(card, targetColumn);

      setBoard((current) => ({
        ...current,
        cards: replaceBoardCard(current.cards, cardId, optimisticCard),
      }));

      if (queueEnabled) {
        outboundSync.enqueue(
          {
            kind: 'moveCard',
            clientMutationId: createClientMutationId(),
            cardId,
            targetColumnId,
            reason: extras?.reason,
            rollback: { cards: previousCards },
          },
          sidecar,
        );
        return { ok: true, card: optimisticCard };
      }

      beginMutation();

      try {
        const response = await fetch(`/api/cards/${cardId}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetColumnId,
            reason: extras?.reason,
          }),
        });
        const payload = await response.json();

        if (!response.ok) {
          setBoard((current) => ({ ...current, cards: previousCards }));
          endMutation(false, payload.error ?? 'Failed to move card.');
          return {
            ok: false,
            code: payload.code as string | undefined,
            message: payload.error ?? 'Failed to move card.',
          };
        }

        setBoard((current) => ({
          ...current,
          cards: replaceBoardCard(current.cards, cardId, payload.data as BoardCardView),
        }));
        endMutation(true);

        return { ok: true, card: payload.data as BoardCardView };
      } catch (moveError) {
        setBoard((current) => ({ ...current, cards: previousCards }));
        const message = moveError instanceof Error ? moveError.message : 'Failed to move card.';
        showError(message);
        endMutation(false, message);
        return { ok: false, message };
      }
    },
    [beginMutation, endMutation, outboundSync, queueEnabled, showError],
  );

  const reorderCard = useCallback(
    async (
      cardId: string,
      targetColumnId: string,
      insertIndex: number,
      extras?: { reason?: string },
    ): Promise<ReorderCardResult> => {
      const currentBoard = boardRef.current;
      const card = currentBoard.cards.find((item) => item.id === cardId);
      if (!card || isTempCardId(cardId)) {
        return { ok: true, card: card ?? ({} as BoardCardView) };
      }

      const targetColumn = currentBoard.columns.find((column) => column.id === targetColumnId);
      if (!targetColumn) {
        return { ok: false, message: 'Target column not found.' };
      }

      const sortedInTarget = currentBoard.cards
        .filter((item) => item.columnId === targetColumnId)
        .sort((a, b) => a.position - b.position);
      const currentIndex = sortedInTarget.findIndex((item) => item.id === cardId);
      const columnCardsWithoutActive = sortedInTarget.filter((item) => item.id !== cardId);
      const clampedIndex = Math.max(0, Math.min(insertIndex, columnCardsWithoutActive.length));

      if (card.columnId === targetColumnId && currentIndex === clampedIndex) {
        return { ok: true, card };
      }

      const previousCards = currentBoard.cards;
      const optimisticCards = reorderBoardCards(
        currentBoard.cards,
        cardId,
        targetColumnId,
        clampedIndex,
        currentBoard.columns,
      );

      setBoard((current) => ({ ...current, cards: optimisticCards }));

      if (queueEnabled) {
        outboundSync.enqueue({
          kind: 'reorderCard',
          clientMutationId: createClientMutationId(),
          cardId,
          targetColumnId,
          insertIndex: clampedIndex,
          crossColumn: card.columnId !== targetColumnId,
          reason: extras?.reason,
          rollback: { cards: previousCards },
        });
        return { ok: true, card: optimisticCards.find((item) => item.id === cardId) ?? card };
      }

      beginMutation();

      try {
        const response = await fetch(`/api/cards/${cardId}/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(card.columnId !== targetColumnId ? { targetColumnId } : {}),
            insertIndex: clampedIndex,
            reason: extras?.reason,
          }),
        });
        const payload = await response.json();

        if (!response.ok) {
          setBoard((current) => ({ ...current, cards: previousCards }));
          endMutation(false, payload.error ?? 'Failed to reorder card.');
          return {
            ok: false,
            code: payload.code as string | undefined,
            message: payload.error ?? 'Failed to reorder card.',
          };
        }

        setBoard((current) => ({
          ...current,
          cards: replaceBoardCard(current.cards, cardId, payload.data as BoardCardView),
        }));
        endMutation(true);

        return { ok: true, card: payload.data as BoardCardView };
      } catch (reorderError) {
        setBoard((current) => ({ ...current, cards: previousCards }));
        const message =
          reorderError instanceof Error ? reorderError.message : 'Failed to reorder card.';
        showError(message);
        endMutation(false, message);
        return { ok: false, message };
      }
    },
    [beginMutation, endMutation, outboundSync, queueEnabled, showError],
  );

  const togglePipelineMode = useCallback(
    async (includeArchived: boolean) => {
      setPipelineModePending(true);
      setError(null);

      try {
        const nextMode = boardRef.current.pipelineMode === 'full' ? 'compact' : 'full';
        const response = await fetch('/api/settings/pipeline-mode', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pipelineMode: nextMode }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to update pipeline mode.');
        }
        await refreshBoard(includeArchived);
      } catch (toggleError) {
        const message =
          toggleError instanceof Error ? toggleError.message : 'Failed to update pipeline mode.';
        showError(message);
      } finally {
        setPipelineModePending(false);
      }
    },
    [refreshBoard, showError],
  );

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
  };
}
