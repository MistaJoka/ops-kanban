'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Archive, Calendar, MoreVertical, UserRound } from 'lucide-react';

import type { BoardColumnView } from '@/lib/domain/board/getBoard';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import {
  ADMIN_ROLES,
  canArchiveCard,
  canMoveCard,
  type OrgRole,
} from '@/lib/domain/auth/roles';
import type { OrgMemberView } from '@/lib/domain/organization/listMembers';
import { cn } from '@/lib/utils';

export type BoardCardPatch = Partial<BoardCardView> & {
  assignedTo?: string | null;
};

type MenuPlacement = { top: number; right: number };

function BoardCardMenuPanel({
  card,
  moveColumns,
  members,
  canAssign,
  canSetDueDate,
  canMove,
  canArchive,
  showAssign,
  showDueDate,
  showMove,
  setShowAssign,
  setShowDueDate,
  setShowMove,
  onPatch,
  onMove,
  onArchive,
  closeMenu,
  menuRef,
  style,
}: {
  card: BoardCardView;
  moveColumns: BoardColumnView[];
  members: OrgMemberView[];
  canAssign: boolean;
  canSetDueDate: boolean;
  canMove: boolean;
  canArchive: boolean;
  showAssign: boolean;
  showDueDate: boolean;
  showMove: boolean;
  setShowAssign: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDueDate: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMove: React.Dispatch<React.SetStateAction<boolean>>;
  onPatch: (patch: BoardCardPatch) => void | Promise<void>;
  onMove: (targetColumnId: string) => void | Promise<void>;
  onArchive: () => void | Promise<void>;
  closeMenu: () => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  style: React.CSSProperties;
}) {
  return (
    <div
      ref={menuRef}
      className="ops-menu ops-menu--portal min-w-[200px]"
      style={style}
      role="menu"
      onClick={(event) => event.stopPropagation()}
    >
      {canAssign ? (
        <>
          <button
            type="button"
            role="menuitem"
            className="ops-menu-item flex items-center gap-2"
            onClick={() => {
              setShowAssign((current) => !current);
              setShowDueDate(false);
              setShowMove(false);
            }}
          >
            <UserRound className="size-3.5 shrink-0 opacity-70" strokeWidth={2.25} />
            Assign
          </button>
          {showAssign ? (
            <select
              value=""
              aria-label="Assign team member"
              className="ops-control mx-1 mb-1 h-8 w-[calc(100%-0.5rem)] py-0 text-xs"
              onChange={(event) => {
                const userId = event.target.value;
                if (!userId) {
                  return;
                }
                void onPatch({ assignedTo: userId });
                closeMenu();
              }}
            >
              <option value="">Select member…</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.fullName ?? member.userId}
                </option>
              ))}
            </select>
          ) : null}
        </>
      ) : null}

      {canSetDueDate ? (
        <>
          <button
            type="button"
            role="menuitem"
            className="ops-menu-item flex items-center gap-2"
            onClick={() => {
              setShowDueDate((current) => !current);
              setShowAssign(false);
              setShowMove(false);
            }}
          >
            <Calendar className="size-3.5 shrink-0 opacity-70" strokeWidth={2.25} />
            Set due date
          </button>
          {showDueDate ? (
            <input
              type="date"
              aria-label="Due date"
              defaultValue={card.dueDate?.slice(0, 10) ?? ''}
              className="ops-control mx-1 mb-1 h-8 w-[calc(100%-0.5rem)] py-0 text-xs"
              onChange={(event) => {
                const value = event.target.value;
                void onPatch({ dueDate: value ? `${value}T12:00:00.000Z` : null });
                closeMenu();
              }}
            />
          ) : null}
        </>
      ) : null}

      {canMove ? (
        <>
          <button
            type="button"
            role="menuitem"
            className="ops-menu-item"
            onClick={() => {
              setShowMove((current) => !current);
              setShowAssign(false);
              setShowDueDate(false);
            }}
          >
            Move to column
          </button>
          {showMove ? (
            <select
              value=""
              aria-label="Move to column"
              className="ops-control mx-1 mb-1 h-8 w-[calc(100%-0.5rem)] py-0 text-xs"
              onChange={(event) => {
                const columnId = event.target.value;
                if (!columnId) {
                  return;
                }
                void onMove(columnId);
                closeMenu();
              }}
            >
              <option value="">Select column…</option>
              {moveColumns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>
          ) : null}
        </>
      ) : null}

      {canArchive ? (
        <>
          <div
            className="my-1 border-t"
            style={{ borderColor: 'var(--topbar-border)' }}
            aria-hidden
          />
          <button
            type="button"
            role="menuitem"
            className="ops-menu-item flex items-center gap-2"
            onClick={() => {
              void onArchive();
              closeMenu();
            }}
          >
            <Archive className="size-3.5 shrink-0 opacity-70" strokeWidth={2.25} />
            Archive
          </button>
        </>
      ) : null}
    </div>
  );
}

export function BoardCardMenu({
  card,
  columns,
  members,
  role,
  onPatch,
  onMove,
  onArchive,
}: {
  card: BoardCardView;
  columns: BoardColumnView[];
  members: OrgMemberView[];
  role: OrgRole;
  onPatch: (patch: BoardCardPatch) => void | Promise<void>;
  onMove: (targetColumnId: string) => void | Promise<void>;
  onArchive: () => void | Promise<void>;
}) {
  const orgRole = role;
  const [open, setOpen] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showDueDate, setShowDueDate] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [placement, setPlacement] = useState<MenuPlacement | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const canEdit = orgRole !== 'viewer';
  const canAssign = ADMIN_ROLES.includes(orgRole);
  const canSetDueDate = canEdit;
  const canMove = canMoveCard(orgRole) && card.stateKey !== 'archived';
  const canArchive = canArchiveCard(orgRole) && card.stateKey !== 'archived';

  const closeMenu = useCallback(() => {
    setOpen(false);
    setShowAssign(false);
    setShowDueDate(false);
    setShowMove(false);
    setPlacement(null);
  }, []);

  const updatePlacement = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? 168;
    const gap = 6;
    let top = rect.top - menuHeight - gap;

    if (top < 8) {
      top = rect.bottom + gap;
    }

    setPlacement({
      top: Math.max(8, top),
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPlacement(null);
      return;
    }

    const anchor = anchorRef.current;
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      setPlacement({
        top: Math.max(8, rect.top - 174),
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }

    updatePlacement();
    const frame = requestAnimationFrame(updatePlacement);

    const onScrollOrResize = () => updatePlacement();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, showAssign, showDueDate, showMove, updatePlacement]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      closeMenu();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, closeMenu]);

  if (!canEdit && !canMove && !canArchive) {
    return null;
  }

  const moveColumns = columns.filter((column) => column.id !== card.columnId);

  const menuStyle: React.CSSProperties = {
    top: placement?.top ?? -9999,
    right: placement?.right ?? 8,
    visibility: placement ? 'visible' : 'hidden',
  };

  const menuPortal =
    open && typeof document !== 'undefined'
      ? createPortal(
          <BoardCardMenuPanel
            card={card}
            moveColumns={moveColumns}
            members={members}
            canAssign={canAssign}
            canSetDueDate={canSetDueDate}
            canMove={canMove}
            canArchive={canArchive}
            showAssign={showAssign}
            showDueDate={showDueDate}
            showMove={showMove}
            setShowAssign={setShowAssign}
            setShowDueDate={setShowDueDate}
            setShowMove={setShowMove}
            onPatch={onPatch}
            onMove={onMove}
            onArchive={onArchive}
            closeMenu={closeMenu}
            menuRef={menuRef}
            style={menuStyle}
          />,
          document.body,
        )
      : null;

  return (
    <div
      className={cn('ops-board-card__menu', open && 'ops-board-card__menu--open')}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        ref={anchorRef}
        type="button"
        aria-label="Job actions"
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'ops-icon-btn size-7 cursor-pointer',
          !open && 'opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100',
          open && 'opacity-100',
        )}
        onClick={() => {
          if (open) {
            closeMenu();
          } else {
            setOpen(true);
          }
        }}
      >
        <MoreVertical className="size-3.5" strokeWidth={2.25} />
      </button>
      {menuPortal}
    </div>
  );
}
