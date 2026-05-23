import type { BoardView } from '@/lib/domain/board/getBoard';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import { type AdvancedFilterKey } from '@/lib/domain/board/boardFilters';

export const GROUP_KEYS = ['sales', 'production', 'billing', 'aftercare'] as const;

export function resolveAdvancedFilter(
  filterKey: AdvancedFilterKey,
  jobTypeFilter: string,
): AdvancedFilterKey | { key: 'job_type'; jobType: string } {
  if (filterKey === 'job_type' && jobTypeFilter) {
    return { key: 'job_type', jobType: jobTypeFilter };
  }

  return filterKey;
}

export function getInsertIndex(
  columnCards: BoardCardView[],
  activeId: string,
  overId: string,
): number {
  const ids = columnCards.map((card) => card.id);
  const activeIndex = ids.indexOf(activeId);
  const overIndex = ids.indexOf(overId);

  if (overIndex === -1) {
    return ids.filter((id) => id !== activeId).length;
  }

  const withoutActive = ids.filter((id) => id !== activeId);
  const adjustedOverIndex = withoutActive.indexOf(overId);

  if (activeIndex !== -1 && activeIndex < overIndex) {
    return adjustedOverIndex + 1;
  }

  return adjustedOverIndex;
}

export function resolveReorderTarget(
  columns: BoardView['columns'],
  cardsByColumn: Map<string, BoardCardView[]>,
  activeId: string,
  overId: string,
): { targetColumnId: string; insertIndex: number } | null {
  if (overId.startsWith('column:')) {
    const targetColumnId = overId.slice('column:'.length);
    const columnCards = cardsByColumn.get(targetColumnId) ?? [];
    return {
      targetColumnId,
      insertIndex: columnCards.filter((card) => card.id !== activeId).length,
    };
  }

  for (const column of columns) {
    const columnCards = cardsByColumn.get(column.id) ?? [];
    if (columnCards.some((card) => card.id === overId)) {
      return {
        targetColumnId: column.id,
        insertIndex: getInsertIndex(columnCards, activeId, overId),
      };
    }
  }

  return null;
}

export function resolveDragOverColumnId(
  columns: BoardView['columns'],
  cardsByColumn: Map<string, BoardCardView[]>,
  overId: string,
): string | null {
  if (overId.startsWith('column:')) {
    return overId.slice('column:'.length);
  }

  for (const column of columns) {
    const columnCards = cardsByColumn.get(column.id) ?? [];
    if (columnCards.some((card) => card.id === overId)) {
      return column.id;
    }
  }

  return null;
}
