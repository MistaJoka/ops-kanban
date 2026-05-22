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
  replaceBoardCard,
  sortBoardCards,
  tempCardId,
} from '@/lib/domain/board/boardOptimistic';

export type MoveCardResult =
  | { ok: true; card: BoardCardView }
  | { ok: false; code?: string; message: string };

export type BoardSyncHandlers = {
  upsertCard: (card: BoardCardView) => void;
  patchCard: (cardId: string, patch: Partial<BoardCardView>) => void;
  removeCard: (cardId: string) => void;
  syncFromDetail: (detail: CardDetailView) => void;
  beginOutboundSync: () => void;
  endOutboundSync: (success: boolean, message?: string) => void;
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

  const hasPendingMutations = useCallback(() => mutationCountRef.current > 0, []);

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

  const beginOutboundSync = useCallback(() => {
    beginMutation();
  }, [beginMutation]);

  const endOutboundSync = useCallback(
    (success: boolean, message?: string) => {
      endMutation(success, message);
    },
    [endMutation],
  );

  const boardSync: BoardSyncHandlers = {
    upsertCard,
    patchCard,
    removeCard,
    syncFromDetail,
    beginOutboundSync,
    endOutboundSync,
  };

  const syncStatus: BoardSyncStatus = useMemo(
    () =>
      buildBoardSyncStatus({
        pendingCount: pendingMutationCount,
        isRefreshing,
        syncIssue,
        lastSyncedAt,
        liveConnected,
      }),
    [pendingMutationCount, isRefreshing, syncIssue, lastSyncedAt, liveConnected],
  );

  const createCard = useCallback(
    async (columnId?: string) => {
      const title = window.prompt('Job title');
      if (!title?.trim()) {
        return;
      }

      const currentBoard = boardRef.current;
      const targetColumnId =
        columnId ??
        currentBoard.columns.find((column) => column.stateKey === 'inquiry')?.id ??
        currentBoard.columns[0]?.id;

      if (!targetColumnId) {
        showError('No column available for new jobs.');
        return;
      }

      const targetColumn = currentBoard.columns.find((column) => column.id === targetColumnId);
      if (!targetColumn) {
        showError('Column not found.');
        return;
      }

      const optimisticId = tempCardId();
      const optimisticCard = createOptimisticBoardCard({
        id: optimisticId,
        title: title.trim(),
        columnId: targetColumnId,
        stateKey: targetColumn.stateKey,
        position: nextCardPosition(currentBoard.cards, targetColumnId),
      });

      const previousCards = currentBoard.cards;
      upsertCard(optimisticCard);
      beginMutation();

      try {
        const response = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), columnId: targetColumnId }),
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to create card.');
        }

        setBoard((current) => ({
          ...current,
          cards: replaceBoardCard(
            removeBoardCardById(current.cards, optimisticId),
            payload.data.id,
            payload.data as BoardCardView,
          ),
        }));
        endMutation(true);
      } catch (createError) {
        setBoard((current) => ({ ...current, cards: previousCards }));
        const message = createError instanceof Error ? createError.message : 'Failed to create card.';
        showError(message);
        endMutation(false, message);
      }
    },
    [beginMutation, endMutation, showError, upsertCard],
  );

  const moveCard = useCallback(
    async (
      cardId: string,
      targetColumnId: string,
      extras?: { reason?: string },
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
    [beginMutation, endMutation, showError],
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
    createCard,
    moveCard,
    togglePipelineMode,
    boardSync,
    hasPendingMutations,
    setLiveConnected,
  };
}
