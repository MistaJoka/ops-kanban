'use client';

import { useCallback, useEffect, useState } from 'react';

import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import type { BoardSyncHandlers } from '@/components/pipeline/useBoardState';
import { createClientMutationId } from '@/components/pipeline/useOutboundSync';

export function useKanbanBulkActions({
  boardCards,
  boardSync,
  refreshBoard,
  includeArchived,
  selectedCardId,
  closeCard,
}: {
  boardCards: BoardCardView[];
  boardSync: BoardSyncHandlers;
  refreshBoard: (includeArchived?: boolean) => Promise<void>;
  includeArchived: boolean;
  selectedCardId: string | null;
  closeCard: () => void;
}) {
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<{ cardIds: string[] } | null>(null);
  const [bulkDeletePending, setBulkDeletePending] = useState(false);

  useEffect(() => {
    setSelectedCardIds((current) => {
      const validIds = new Set(boardCards.map((card) => card.id));
      let changed = false;
      const next = new Set<string>();
      for (const id of current) {
        if (validIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [boardCards]);

  const toggleCardSelection = useCallback((cardId: string) => {
    setSelectedCardIds((current) => {
      const next = new Set(current);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }, []);

  const selectAllInColumn = useCallback((_columnId: string, cardIds: string[]) => {
    setSelectedCardIds((current) => {
      const next = new Set(current);
      const allSelected = cardIds.length > 0 && cardIds.every((id) => next.has(id));
      if (allSelected) {
        for (const id of cardIds) next.delete(id);
      } else {
        for (const id of cardIds) next.add(id);
      }
      return next;
    });
  }, []);

  const requestDeleteSelectedInColumn = useCallback((_columnId: string, cardIds: string[]) => {
    if (cardIds.length === 0) return;
    setBulkDeleteConfirm({ cardIds: [...cardIds] });
  }, []);

  const confirmBulkDelete = useCallback(async () => {
    if (!bulkDeleteConfirm || bulkDeleteConfirm.cardIds.length === 0) return;

    const cardIds = bulkDeleteConfirm.cardIds;
    const previousCards = boardSync.getBoardSnapshot();
    setBulkDeletePending(true);

    for (const cardId of cardIds) {
      boardSync.removeCard(cardId);
    }

    setSelectedCardIds((current) => {
      const next = new Set(current);
      for (const id of cardIds) next.delete(id);
      return next;
    });

    try {
      if (boardSync.queueEnabled) {
        for (const cardId of cardIds) {
          boardSync.enqueue({
            kind: 'deleteCard',
            clientMutationId: createClientMutationId(),
            cardId,
            rollback: { cards: previousCards },
          });
        }
      } else {
        boardSync.beginOutboundSync();
        for (const cardId of cardIds) {
          const response = await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? 'Failed to delete job.');
        }
        boardSync.endOutboundSync(true);
      }

      setBulkDeleteConfirm(null);
      if (selectedCardId && cardIds.includes(selectedCardId)) closeCard();
    } catch (deleteError) {
      if (!boardSync.queueEnabled) {
        await refreshBoard(includeArchived);
        boardSync.endOutboundSync(
          false,
          deleteError instanceof Error ? deleteError.message : 'Failed to delete jobs.',
        );
      }
    } finally {
      setBulkDeletePending(false);
    }
  }, [boardSync, bulkDeleteConfirm, closeCard, includeArchived, refreshBoard, selectedCardId]);

  return {
    selectedCardIds,
    bulkDeleteConfirm,
    setBulkDeleteConfirm,
    bulkDeletePending,
    toggleCardSelection,
    selectAllInColumn,
    requestDeleteSelectedInColumn,
    confirmBulkDelete,
  };
}
