'use client';

import { useCallback, useState } from 'react';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';

import type { BoardView } from '@/lib/domain/board/getBoard';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import {
  resolveDragOverColumnId,
  resolveReorderTarget,
} from '@/components/pipeline/kanban-board/kanbanDndUtils';

export function useKanbanDragHandlers({
  board,
  cardsByColumn,
  reorderCard,
  onColumnChange,
}: {
  board: BoardView;
  cardsByColumn: Map<string, BoardCardView[]>;
  reorderCard: (
    cardId: string,
    targetColumnId: string,
    insertIndex: number,
  ) => Promise<{ ok: boolean }>;
  onColumnChange: (cardId: string, stateKey: string) => void;
}) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveCardId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const overId = event.over ? String(event.over.id) : null;
      if (!overId) {
        setDragOverColumnId(null);
        return;
      }
      setDragOverColumnId(resolveDragOverColumnId(board.columns, cardsByColumn, overId));
    },
    [board.columns, cardsByColumn],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const activeId = String(event.active.id);
      const overId = event.over ? String(event.over.id) : null;
      setActiveCardId(null);
      setDragOverColumnId(null);
      if (!overId) return;

      const target = resolveReorderTarget(board.columns, cardsByColumn, activeId, overId);
      if (!target) return;

      const targetColumn = board.columns.find((column) => column.id === target.targetColumnId);
      const result = await reorderCard(activeId, target.targetColumnId, target.insertIndex);
      if (result.ok && targetColumn) {
        const priorStateKey = board.cards.find((card) => card.id === activeId)?.stateKey;
        if (priorStateKey !== targetColumn.stateKey) {
          onColumnChange(activeId, targetColumn.stateKey);
        }
      }
    },
    [board.columns, board.cards, cardsByColumn, onColumnChange, reorderCard],
  );

  const handleDragCancel = useCallback(() => {
    setActiveCardId(null);
    setDragOverColumnId(null);
  }, []);

  return {
    activeCardId,
    dragOverColumnId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
