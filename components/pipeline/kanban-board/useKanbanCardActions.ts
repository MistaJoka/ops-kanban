'use client';

import { useCallback } from 'react';

import type { BoardView } from '@/lib/domain/board/getBoard';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import { getAssigneeInitials } from '@/lib/domain/cards/boardCardFormatters';
import { isTempCardId } from '@/lib/domain/board/boardOptimistic';
import type { OrgMemberView } from '@/lib/domain/organization/listMembers';
import type { BoardCardPatch } from '@/components/pipeline/BoardCardMenu';
import type { BoardSyncHandlers } from '@/components/pipeline/useBoardState';
import { createClientMutationId } from '@/components/pipeline/useOutboundSync';

export function useKanbanCardActions({
  board,
  boardSync,
  members,
  reorderCard,
  onColumnChange,
}: {
  board: BoardView;
  boardSync: BoardSyncHandlers;
  members: OrgMemberView[];
  reorderCard: (
    cardId: string,
    targetColumnId: string,
    insertIndex: number,
  ) => Promise<{ ok: boolean }>;
  onColumnChange: (cardId: string, stateKey: string) => void;
}) {
  const handleMoveCard = useCallback(
    async (cardId: string, targetColumnId: string) => {
      const targetColumn = board.columns.find((column) => column.id === targetColumnId);
      const columnCards = board.cards
        .filter((card) => card.columnId === targetColumnId && card.id !== cardId)
        .sort((a, b) => a.position - b.position);
      const result = await reorderCard(cardId, targetColumnId, columnCards.length);
      if (result.ok && targetColumn) onColumnChange(cardId, targetColumn.stateKey);
    },
    [board.cards, board.columns, onColumnChange, reorderCard],
  );

  const handlePatchCard = useCallback(
    async (cardId: string, patch: BoardCardPatch) => {
      const existing = board.cards.find((card) => card.id === cardId);
      if (!existing || isTempCardId(cardId)) return;

      const optimisticPatch: Partial<BoardCardView> = {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.dueDate !== undefined ? { dueDate: patch.dueDate } : {}),
      };
      if (patch.assignedTo !== undefined) {
        const member = members.find((item) => item.userId === patch.assignedTo);
        optimisticPatch.assignedTo = patch.assignedTo;
        optimisticPatch.assigneeName = member?.fullName ?? null;
        optimisticPatch.assigneeInitials = getAssigneeInitials(member?.fullName);
      }

      boardSync.patchCard(cardId, optimisticPatch);
      const apiPatch: Record<string, unknown> = {};
      if (patch.title !== undefined) apiPatch.title = patch.title;
      if (patch.dueDate !== undefined) apiPatch.dueDate = patch.dueDate;
      if (patch.assignedTo !== undefined) apiPatch.assignedTo = patch.assignedTo;

      if (boardSync.queueEnabled) {
        boardSync.enqueue({
          kind: 'patchCard',
          clientMutationId: createClientMutationId(),
          cardId,
          patch: apiPatch,
          rollback: { cards: board.cards },
        });
        return;
      }

      boardSync.beginOutboundSync();
      try {
        const response = await fetch(`/api/cards/${cardId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiPatch),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? 'Failed to save job.');
        boardSync.syncFromDetail(payload.data);
        boardSync.endOutboundSync(true);
      } catch (patchError) {
        boardSync.patchCard(cardId, existing);
        boardSync.endOutboundSync(
          false,
          patchError instanceof Error ? patchError.message : 'Failed to save job.',
        );
      }
    },
    [board.cards, boardSync, members],
  );

  const handleArchiveCard = useCallback(
    async (cardId: string) => {
      const archivedColumn = board.columns.find((column) => column.stateKey === 'archived');
      if (!archivedColumn) return;
      const columnCards = board.cards
        .filter((card) => card.columnId === archivedColumn.id && card.id !== cardId)
        .sort((a, b) => a.position - b.position);
      await reorderCard(cardId, archivedColumn.id, columnCards.length);
    },
    [board.cards, board.columns, reorderCard],
  );

  return {
    handleMoveCard,
    handlePatchCard,
    handleArchiveCard,
  };
}
