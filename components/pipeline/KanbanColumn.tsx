'use client';

import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Trash2 } from 'lucide-react';

import type { BoardColumnView } from '@/lib/domain/board/getBoard';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import { isTempCardId } from '@/lib/domain/board/boardOptimistic';
import { BoardCard } from '@/components/pipeline/BoardCard';
import { BoardCardSelectCheckbox } from '@/components/pipeline/BoardCardSelectCheckbox';
import type { BoardCardPatch } from '@/components/pipeline/BoardCardMenu';
import type { OrgRole } from '@/lib/domain/auth/roles';
import type { OrgMemberView } from '@/lib/domain/organization/listMembers';
import { cn } from '@/lib/utils';

export function columnDroppableId(columnId: string): string {
  return `column:${columnId}`;
}

export const KanbanColumn = memo(function KanbanColumn({
  column,
  columns,
  cards,
  members,
  role,
  activeCardId,
  onCreate,
  onOpenCard,
  onPatchCard,
  onMoveCard,
  onArchiveCard,
  isDragTarget,
  selectionEnabled = false,
  selectedCardIds,
  onToggleSelect,
  onSelectAllInColumn,
  onDeleteSelectedInColumn,
}: {
  column: BoardColumnView;
  columns: BoardColumnView[];
  cards: BoardCardView[];
  members: OrgMemberView[];
  role: OrgRole;
  activeCardId: string | null;
  onCreate: (columnId: string) => void;
  onOpenCard: (cardId: string) => void;
  onPatchCard: (cardId: string, patch: BoardCardPatch) => void | Promise<void>;
  onMoveCard: (cardId: string, targetColumnId: string) => void | Promise<void>;
  onArchiveCard: (cardId: string) => void | Promise<void>;
  isDragTarget: boolean;
  selectionEnabled?: boolean;
  selectedCardIds?: ReadonlySet<string>;
  onToggleSelect?: (cardId: string) => void;
  onSelectAllInColumn?: (columnId: string, cardIds: string[]) => void;
  onDeleteSelectedInColumn?: (columnId: string, cardIds: string[]) => void;
}) {
  const isAnyDragging = activeCardId !== null;
  const cardIds = cards.map((card) => card.id);
  const selectableCards = cards.filter((card) => !isTempCardId(card.id));
  const selectableIds = selectableCards.map((card) => card.id);
  const selectedInColumn = selectableIds.filter((id) => selectedCardIds?.has(id) ?? false);
  const showBulkSelect = selectionEnabled && selectedInColumn.length > 0;
  const allSelected = selectableIds.length > 0 && selectedInColumn.length === selectableIds.length;
  const someSelected = selectedInColumn.length > 0 && !allSelected;

  const { setNodeRef, isOver } = useDroppable({
    id: columnDroppableId(column.id),
    data: {
      type: 'column',
      columnId: column.id,
    },
  });

  const showDropTarget = isDragTarget || isOver;

  return (
    <section className={cn('ops-column', showDropTarget && 'ops-column--drop-target')}>
      <header className="rounded-t-xl border-b border-[var(--border-subtle)] bg-[var(--group-header-bg)] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-[13px] font-semibold tracking-tight text-[var(--group-header-text)]">
              {column.name}
            </h2>
            <p
              className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]"
              title={column.stateKey}
            >
              {column.stateKey.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--control-bg)]/80 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--text-secondary)]">
              {cards.length}
            </span>
            <button
              type="button"
              onClick={() => onCreate(column.id)}
              className="inline-flex size-7 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--control-bg)] text-[var(--accent)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]"
              aria-label={`Add job to ${column.name}`}
            >
              <Plus className="size-3.5" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </header>

      <div
        ref={setNodeRef}
        className="flex min-h-0 flex-1 flex-col gap-[var(--card-stack-gap)] overflow-y-auto p-2.5"
      >
        {cards.length === 0 ? (
          <div
            className={cn(
              'flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed px-3 py-10 text-center transition-colors',
              showDropTarget
                ? 'border-[var(--accent)] bg-[var(--accent-muted)]/40'
                : 'border-[var(--topbar-border)]',
            )}
          >
            <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">
              {showDropTarget ? 'Drop job here' : 'Empty'}
            </p>
            {!showDropTarget ? (
              <button
                type="button"
                onClick={() => onCreate(column.id)}
                className="mt-2 text-xs font-medium text-[var(--accent)] hover:underline"
              >
                + Add job
              </button>
            ) : null}
          </div>
        ) : (
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {showBulkSelect ? (
              <div className="ops-column__bulk-select">
                <label className="ops-column__bulk-select-all">
                  <BoardCardSelectCheckbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={() => onSelectAllInColumn?.(column.id, selectableIds)}
                    label={
                      allSelected
                        ? `Deselect all jobs in ${column.name}`
                        : `Select all jobs in ${column.name}`
                    }
                    className="ops-board-card__select--bulk"
                  />
                  <span>All</span>
                </label>
                <button
                  type="button"
                  className="ops-column__bulk-delete"
                  aria-label={`Delete ${selectedInColumn.length} selected job${
                    selectedInColumn.length === 1 ? '' : 's'
                  }`}
                  title={`Delete ${selectedInColumn.length} selected`}
                  onClick={() => onDeleteSelectedInColumn?.(column.id, selectedInColumn)}
                >
                  <Trash2 className="size-3.5" strokeWidth={2.25} />
                </button>
              </div>
            ) : null}
            {showDropTarget ? <div className="ops-drop-indicator" aria-hidden /> : null}
            {cards.map((card) => (
              <BoardCard
                key={card.id}
                card={card}
                columns={columns}
                members={members}
                role={role}
                onOpen={onOpenCard}
                onPatch={(patch) => onPatchCard(card.id, patch)}
                onMove={(targetColumnId) => onMoveCard(card.id, targetColumnId)}
                onArchive={() => onArchiveCard(card.id)}
                isDimmed={isAnyDragging && activeCardId !== card.id}
                selectionEnabled={selectionEnabled}
                isSelected={selectedCardIds?.has(card.id) ?? false}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </section>
  );
});
