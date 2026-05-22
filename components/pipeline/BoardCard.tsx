'use client';

import { memo, useRef } from 'react';

import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import {
  CardAccentBar,
  CardDragGrip,
  CardFooter,
  CardPriorityBadge,
  CardSignalsRow,
  formatPropertyLine,
} from '@/components/pipeline/board-card-primitives';
import { cn } from '@/lib/utils';

let dragGhostEl: HTMLElement | null = null;

function clearDragGhost() {
  if (dragGhostEl?.parentNode) {
    dragGhostEl.parentNode.removeChild(dragGhostEl);
  }
  dragGhostEl = null;
}

export const BoardCard = memo(function BoardCard({
  card,
  onDragStart,
  onDragEnd,
  onOpen,
  isDragging = false,
  isDimmed = false,
}: {
  card: BoardCardView;
  onDragStart: (cardId: string) => void;
  onDragEnd: () => void;
  onOpen: (cardId: string) => void;
  isDragging?: boolean;
  isDimmed?: boolean;
}) {
  const didDragRef = useRef(false);
  const propertyLine = formatPropertyLine(card);

  return (
    <article
      draggable
      onDragStart={(event) => {
        didDragRef.current = true;
        event.dataTransfer.effectAllowed = 'move';

        const target = event.currentTarget as HTMLElement;
        clearDragGhost();
        const ghost = target.cloneNode(true) as HTMLElement;
        ghost.style.width = `${target.offsetWidth}px`;
        ghost.style.position = 'fixed';
        ghost.style.top = '-9999px';
        ghost.style.left = '-9999px';
        ghost.style.pointerEvents = 'none';
        ghost.classList.remove('ops-board-card--source', 'ops-board-card--dimmed');
        ghost.classList.add('ops-board-card--dragging');
        const rect = target.getBoundingClientRect();
        document.body.appendChild(ghost);
        dragGhostEl = ghost;
        event.dataTransfer.setDragImage(
          ghost,
          event.clientX - rect.left,
          event.clientY - rect.top,
        );

        onDragStart(card.id);
      }}
      onDragEnd={() => {
        clearDragGhost();
        onDragEnd();
        window.setTimeout(() => {
          didDragRef.current = false;
        }, 0);
      }}
      onClick={() => {
        if (!didDragRef.current) {
          onOpen(card.id);
        }
      }}
      className={cn(
        'ops-board-card select-none',
        isDragging && 'ops-board-card--source',
        isDimmed && !isDragging && 'ops-board-card--dimmed',
      )}
    >
      <CardAccentBar category={card.columnCategory} />
      <CardDragGrip />

      <div className="ops-board-card__inner">
        <header className="ops-board-card__header">
          <h3 className="ops-board-card__title">{card.title}</h3>
          <CardPriorityBadge priority={card.priority} />
        </header>

        {propertyLine ? (
          <p className="ops-board-card__property" title={propertyLine}>
            {propertyLine}
          </p>
        ) : null}

        <CardSignalsRow card={card} />

        <CardFooter
          nextAction={card.nextAction}
          daysInColumn={card.daysInColumn}
          isOverdue={card.isOverdue}
        />
      </div>
    </article>
  );
});
