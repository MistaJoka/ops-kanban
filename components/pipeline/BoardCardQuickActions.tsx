'use client';

import { useCallback, useRef, useState } from 'react';
import { ArrowRight, Calendar, Flag, UserRound } from 'lucide-react';

import type { BoardColumnView } from '@/lib/domain/board/getBoard';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import { ADMIN_ROLES, canMoveCard, type OrgRole } from '@/lib/domain/auth/roles';
import type { OrgMemberView } from '@/lib/domain/organization/listMembers';
import type { BoardCardPatch } from '@/components/pipeline/BoardCardMenu';
import { cn } from '@/lib/utils';

export function BoardCardQuickActions({
  card,
  columns,
  members,
  role,
  onPatch,
  onMove,
}: {
  card: BoardCardView;
  columns: BoardColumnView[];
  members: OrgMemberView[];
  role: OrgRole;
  onPatch: (patch: BoardCardPatch) => void | Promise<void>;
  onMove: (targetColumnId: string) => void | Promise<void>;
}) {
  const [activePanel, setActivePanel] = useState<'assign' | 'due' | 'priority' | 'move' | null>(
    null,
  );
  const wrapRef = useRef<HTMLDivElement>(null);

  const canAssign = ADMIN_ROLES.includes(role);
  const canSetDueDate = role !== 'viewer';
  const canSetPriority = canAssign;
  const canMove = canMoveCard(role);
  const moveColumns = columns.filter((column) => column.id !== card.columnId);

  const closePanel = useCallback(() => setActivePanel(null), []);

  if (!canAssign && !canSetDueDate && !canSetPriority && !canMove) {
    return null;
  }

  return (
    <div
      ref={wrapRef}
      className="ops-board-card__quick-actions"
      onClick={(event) => event.stopPropagation()}
    >
      {canAssign ? (
        <button
          type="button"
          className="ops-board-card__quick-btn"
          aria-label="Assign"
          title="Assign"
          onClick={() => setActivePanel(activePanel === 'assign' ? null : 'assign')}
        >
          <UserRound className="size-3" strokeWidth={2.25} />
        </button>
      ) : null}
      {canSetDueDate ? (
        <button
          type="button"
          className="ops-board-card__quick-btn"
          aria-label="Set due date"
          title="Due date"
          onClick={() => setActivePanel(activePanel === 'due' ? null : 'due')}
        >
          <Calendar className="size-3" strokeWidth={2.25} />
        </button>
      ) : null}
      {canSetPriority ? (
        <button
          type="button"
          className="ops-board-card__quick-btn"
          aria-label="Set priority"
          title="Priority"
          onClick={() => setActivePanel(activePanel === 'priority' ? null : 'priority')}
        >
          <Flag className="size-3" strokeWidth={2.25} />
        </button>
      ) : null}
      {canMove && moveColumns.length > 0 ? (
        <button
          type="button"
          className="ops-board-card__quick-btn"
          aria-label="Move column"
          title="Move"
          onClick={() => setActivePanel(activePanel === 'move' ? null : 'move')}
        >
          <ArrowRight className="size-3" strokeWidth={2.25} />
        </button>
      ) : null}

      {activePanel ? (
        <div
          className={cn(
            'absolute left-2 right-2 top-full z-20 mt-1 rounded-md border p-1.5',
            'border-[var(--topbar-border)] bg-[var(--control-bg)] shadow-[var(--shadow-lift)]',
          )}
        >
          {activePanel === 'assign' ? (
            <select
              value={card.assignedTo ?? ''}
              aria-label="Assign team member"
              className="ops-control h-7 w-full py-0 text-xs"
              onChange={(event) => {
                void onPatch({ assignedTo: event.target.value || null });
                closePanel();
              }}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.fullName ?? member.userId}
                </option>
              ))}
            </select>
          ) : null}
          {activePanel === 'due' ? (
            <input
              type="date"
              aria-label="Due date"
              defaultValue={card.dueDate?.slice(0, 10) ?? ''}
              className="ops-control h-7 w-full py-0 text-xs"
              onChange={(event) => {
                const value = event.target.value;
                void onPatch({ dueDate: value ? `${value}T12:00:00.000Z` : null });
                closePanel();
              }}
            />
          ) : null}
          {activePanel === 'priority' ? (
            <select
              value={card.priority}
              aria-label="Priority"
              className="ops-control h-7 w-full py-0 text-xs capitalize"
              onChange={(event) => {
                void onPatch({ priority: event.target.value });
                closePanel();
              }}
            >
              {['low', 'medium', 'high', 'urgent'].map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          ) : null}
          {activePanel === 'move' ? (
            <select
              value=""
              aria-label="Move to column"
              className="ops-control h-7 w-full py-0 text-xs"
              onChange={(event) => {
                const columnId = event.target.value;
                if (!columnId) {
                  return;
                }
                void onMove(columnId);
                closePanel();
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
        </div>
      ) : null}
    </div>
  );
}
