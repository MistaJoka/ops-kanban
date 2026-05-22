'use client';

import { memo } from 'react';
import { Plus } from 'lucide-react';

import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import type { BoardColumnView } from '@/lib/domain/board/getBoard';
import { BoardCard } from '@/components/pipeline/BoardCard';
import { cn } from '@/lib/utils';

export const KanbanColumn = memo(function KanbanColumn({
  column,
  cards,
  draggingCardId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onCreate,
  onOpenCard,
  isDragTarget,
}: {
  column: BoardColumnView;
  cards: BoardCardView[];
  draggingCardId: string | null;
  onDragStart: (cardId: string) => void;
  onDragEnd: () => void;
  onDragOver: (columnId: string) => void;
  onDrop: (columnId: string) => void;
  onCreate: (columnId: string) => void;
  onOpenCard: (cardId: string) => void;
  isDragTarget: boolean;
}) {
  const isAnyDragging = draggingCardId !== null;

  return (
    <section
      className={cn('ops-column', isDragTarget && 'ops-column--drop-target')}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver(column.id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(column.id);
      }}
    >
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

      <div className="flex flex-1 flex-col gap-[var(--card-stack-gap)] overflow-y-auto p-2.5">
        {cards.length === 0 ? (
          <div
            className={cn(
              'flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed px-3 py-10 text-center transition-colors',
              isDragTarget
                ? 'border-[var(--accent)] bg-[var(--accent-muted)]/40'
                : 'border-[var(--topbar-border)]',
            )}
          >
            <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">
              {isDragTarget ? 'Drop job here' : 'Empty'}
            </p>
            {!isDragTarget ? (
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
          <>
            {isDragTarget ? <div className="ops-drop-indicator" aria-hidden /> : null}
            {cards.map((card) => (
              <BoardCard
                key={card.id}
                card={card}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onOpen={onOpenCard}
                isDragging={draggingCardId === card.id}
                isDimmed={isAnyDragging && draggingCardId !== card.id}
              />
            ))}
          </>
        )}
      </div>
    </section>
  );
});
