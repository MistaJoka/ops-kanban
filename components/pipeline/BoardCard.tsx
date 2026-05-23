'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { BoardColumnView } from '@/lib/domain/board/getBoard';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import { isTempCardId } from '@/lib/domain/board/boardOptimistic';
import {
  CardAccentBar,
  CardDragGrip,
  CardFooter,
  CardHeaderStatus,
  CardMetaRow,
  CardPriorityBadge,
  CardPropertyLine,
  formatPropertyLine,
} from '@/components/pipeline/board-card-primitives';
import { BoardCardMenu, type BoardCardPatch } from '@/components/pipeline/BoardCardMenu';
import { BoardCardSelectCheckbox } from '@/components/pipeline/BoardCardSelectCheckbox';
import type { OrgRole } from '@/lib/domain/auth/roles';
import type { OrgMemberView } from '@/lib/domain/organization/listMembers';
import { cn } from '@/lib/utils';

type BoardCardSurfaceProps = {
  card: BoardCardView;
  columns: BoardColumnView[];
  members: OrgMemberView[];
  role: OrgRole;
  onOpen: (cardId: string) => void;
  onPatch: (patch: BoardCardPatch) => void | Promise<void>;
  onMove: (targetColumnId: string) => void | Promise<void>;
  onArchive: () => void | Promise<void>;
  isSelected?: boolean;
  selectionEnabled?: boolean;
  onToggleSelect?: (cardId: string) => void;
  isDragging?: boolean;
  isDimmed?: boolean;
  isOverlay?: boolean;
  sortableProps?: Pick<
    React.HTMLAttributes<HTMLElement>,
    | 'onPointerDown'
    | 'onKeyDown'
    | 'role'
    | 'tabIndex'
    | 'aria-describedby'
    | 'aria-pressed'
    | 'aria-roledescription'
    | 'aria-disabled'
  >;
  style?: React.CSSProperties;
  setNodeRef?: (node: HTMLElement | null) => void;
};

export const BoardCardSurface = memo(function BoardCardSurface({
  card,
  columns,
  members,
  role,
  onOpen,
  onPatch,
  onMove,
  onArchive,
  isSelected = false,
  selectionEnabled = false,
  onToggleSelect,
  isDragging = false,
  isDimmed = false,
  isOverlay = false,
  sortableProps,
  style,
  setNodeRef,
}: BoardCardSurfaceProps) {
  const didDragRef = useRef(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(card.title);
  const propertyLine = formatPropertyLine(card);
  const canEditTitle = role !== 'viewer';

  useEffect(() => {
    if (!editingTitle) {
      setTitleDraft(card.title);
    }
  }, [card.title, editingTitle]);

  const commitTitle = () => {
    const nextTitle = titleDraft.trim();
    setEditingTitle(false);

    if (!nextTitle || nextTitle === card.title) {
      setTitleDraft(card.title);
      return;
    }

    void onPatch({ title: nextTitle });
  };

  const cardLabel = [
    card.title,
    propertyLine,
    card.isOverdue ? 'overdue' : null,
    card.priority !== 'medium' ? card.priority : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...(isOverlay ? {} : sortableProps)}
      aria-label={cardLabel}
      onClick={() => {
        if (!didDragRef.current && !editingTitle && !isOverlay) {
          onOpen(card.id);
        }
      }}
      className={cn(
        'group/card ops-board-card select-none',
        `ops-board-card--${card.columnCategory}`,
        isOverlay && 'ops-board-card--dragging',
        isDragging && !isOverlay && 'ops-board-card--source',
        isDimmed && !isDragging && 'ops-board-card--dimmed',
        card.isOverdue && 'ops-board-card--overdue',
        card.priority === 'urgent' && 'ops-board-card--urgent',
        isSelected && 'ops-board-card--selected',
      )}
    >
      <CardAccentBar category={card.columnCategory} />
      <CardDragGrip />

      <div className="ops-board-card__surface">
        <div className="ops-board-card__inner">
          <header className="ops-board-card__header">
            {editingTitle ? (
              <input
                value={titleDraft}
                autoFocus
                aria-label="Job title"
                className="ops-board-card__title w-full rounded border border-[var(--border-strong)] bg-[var(--control-bg)] px-1 py-0.5 outline-none"
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => setTitleDraft(event.target.value)}
                onBlur={() => commitTitle()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    commitTitle();
                  }
                  if (event.key === 'Escape') {
                    setTitleDraft(card.title);
                    setEditingTitle(false);
                  }
                }}
              />
            ) : (
              <h3
                className="ops-board-card__title"
                onDoubleClick={(event) => {
                  if (!canEditTitle || isOverlay) {
                    return;
                  }
                  event.stopPropagation();
                  setTitleDraft(card.title);
                  setEditingTitle(true);
                }}
              >
                {card.title}
              </h3>
            )}
            <div className="flex shrink-0 items-center gap-1">
              {selectionEnabled && !isOverlay && onToggleSelect && !isTempCardId(card.id) ? (
                <BoardCardSelectCheckbox
                  checked={isSelected}
                  onChange={() => onToggleSelect(card.id)}
                  label={isSelected ? `Deselect ${card.title}` : `Select ${card.title}`}
                />
              ) : null}
              <CardHeaderStatus card={card} />
              <CardPriorityBadge priority={card.priority} />
              {!isOverlay ? (
                <BoardCardMenu
                  card={card}
                  columns={columns}
                  members={members}
                  role={role}
                  onPatch={onPatch}
                  onMove={onMove}
                  onArchive={onArchive}
                />
              ) : null}
            </div>
          </header>

          {propertyLine ? <CardPropertyLine line={propertyLine} /> : null}

          <CardMetaRow card={card} />

          <CardFooter
            nextAction={card.nextAction}
            daysInColumn={card.daysInColumn}
            isOverdue={card.isOverdue}
            columnCategory={card.columnCategory}
          />
        </div>
      </div>
    </article>
  );
});

export const BoardCard = memo(function BoardCard({
  card,
  columns,
  members,
  role,
  onOpen,
  onPatch,
  onMove,
  onArchive,
  isSelected = false,
  selectionEnabled = false,
  onToggleSelect,
  isDimmed = false,
}: {
  card: BoardCardView;
  columns: BoardColumnView[];
  members: OrgMemberView[];
  role: OrgRole;
  onOpen: (cardId: string) => void;
  onPatch: (patch: BoardCardPatch) => void | Promise<void>;
  onMove: (targetColumnId: string) => void | Promise<void>;
  onArchive: () => void | Promise<void>;
  isSelected?: boolean;
  selectionEnabled?: boolean;
  onToggleSelect?: (cardId: string) => void;
  isDimmed?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: isTempCardId(card.id),
    data: {
      type: 'card',
      columnId: card.columnId,
    },
  });

  return (
    <BoardCardSurface
      card={card}
      columns={columns}
      members={members}
      role={role}
      onOpen={onOpen}
      onPatch={onPatch}
      onMove={onMove}
      onArchive={onArchive}
      isSelected={isSelected}
      selectionEnabled={selectionEnabled}
      onToggleSelect={onToggleSelect}
      isDragging={isDragging}
      isDimmed={isDimmed}
      setNodeRef={setNodeRef}
      sortableProps={{ ...attributes, ...listeners }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    />
  );
});
