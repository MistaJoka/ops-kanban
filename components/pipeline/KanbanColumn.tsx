'use client';

import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';

import type { BoardColumnView } from '@/lib/domain/board/getBoard';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import { COLUMN_CATEGORY } from '@/lib/domain/pipeline/types';
import { BoardCard } from '@/components/pipeline/BoardCard';
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
  selectionActive = false,
  selectedCardIds,
  onToggleSelect,
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
  selectionActive?: boolean;
  selectedCardIds?: ReadonlySet<string>;
  onToggleSelect?: (cardId: string) => void;
}) {
  const isAnyDragging = activeCardId !== null;
  const cardIds = cards.map((card) => card.id);
  const category = COLUMN_CATEGORY[column.stateKey] ?? 'sales';

  const { setNodeRef, isOver } = useDroppable({
    id: columnDroppableId(column.id),
    data: {
      type: 'column',
      columnId: column.id,
    },
  });

  const showDropTarget = isDragTarget || isOver;

  return (
    <section
      data-column-id={column.id}
      className={cn('ops-column', `ops-column--${category}`, showDropTarget && 'ops-column--drop-target')}
    >
      <header className="ops-column__header">
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
            className={cn('ops-column-empty', showDropTarget && 'ops-column-empty--drop-target')}
          >
            <p className="ops-column-empty__label">
              {showDropTarget ? 'Release to drop here' : 'No jobs in stage'}
            </p>
            {!showDropTarget ? (
              <button
                type="button"
                onClick={() => onCreate(column.id)}
                className="ops-column-empty__action"
              >
                Add job
              </button>
            ) : null}
          </div>
        ) : (
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
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
                selectionActive={selectionActive}
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
