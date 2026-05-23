'use client';

import Image from 'next/image';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type SensorDescriptor,
} from '@dnd-kit/core';

import { KanbanColumn } from '@/components/pipeline/KanbanColumn';
import { BoardCardSurface } from '@/components/pipeline/BoardCard';
import { PipelineGroupJump } from '@/components/pipeline/PipelineGroupJump';
import type { BoardView } from '@/lib/domain/board/getBoard';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import type { OrgMemberView } from '@/lib/domain/organization/listMembers';
import type { OrgRole } from '@/lib/domain/auth/roles';
import type { BoardCardPatch } from '@/components/pipeline/BoardCardMenu';
import type { PipelineGroupKey } from '@/lib/landscaping-full-pipeline';

type ColumnGroup = {
  key: string;
  label: string | null;
  columns: BoardView['columns'];
};

type Props = {
  sensors: SensorDescriptor<object>[];
  showGroupJump: boolean;
  activeGroup: PipelineGroupKey | null;
  onJumpGroup: (key: PipelineGroupKey) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel: () => void;
  setBoardScrollRef: (element: HTMLDivElement | null) => void;
  setGroupRef: (key: PipelineGroupKey, element: HTMLDivElement | null) => void;
  showEmptyBoard: boolean;
  onOpenNewJob: () => void;
  columnGroups: ColumnGroup[];
  board: BoardView;
  cardsByColumn: Map<string, BoardCardView[]>;
  members: OrgMemberView[];
  orgRole: OrgRole;
  activeCardId: string | null;
  activeCard: BoardCardView | null;
  onCreate: (columnId?: string) => void;
  onOpenCard: (cardId: string) => void;
  onPatchCard: (cardId: string, patch: BoardCardPatch) => void;
  onMoveCard: (cardId: string, targetColumnId: string) => void;
  onArchiveCard: (cardId: string) => void;
  dragOverColumnId: string | null;
  selectionEnabled: boolean;
  selectedCardIds: Set<string>;
  onToggleSelect: (cardId: string) => void;
  onSelectAllInColumn: (columnId: string, cardIds: string[]) => void;
  onDeleteSelectedInColumn: (columnId: string, cardIds: string[]) => void;
};

export function KanbanBoardDndArea({
  sensors,
  showGroupJump,
  activeGroup,
  onJumpGroup,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDragCancel,
  setBoardScrollRef,
  setGroupRef,
  showEmptyBoard,
  onOpenNewJob,
  columnGroups,
  board,
  cardsByColumn,
  members,
  orgRole,
  activeCardId,
  activeCard,
  onCreate,
  onOpenCard,
  onPatchCard,
  onMoveCard,
  onArchiveCard,
  dragOverColumnId,
  selectionEnabled,
  selectedCardIds,
  onToggleSelect,
  onSelectAllInColumn,
  onDeleteSelectedInColumn,
}: Props) {
  return (
    <div className="ops-pipeline-body">
      {showGroupJump ? (
        <PipelineGroupJump
          activeGroup={activeGroup}
          onJump={(key) => {
            onJumpGroup(key);
          }}
        />
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div ref={setBoardScrollRef} className="ops-board-surface p-3 md:p-4">
          {showEmptyBoard ? (
            <div
              role="status"
              className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4 px-6 text-center"
            >
              <Image
                src="/brand/empty-pipeline.svg"
                alt=""
                width={320}
                height={120}
                className="opacity-90"
              />
              <p className="text-sm text-[var(--text-secondary)]">
                Your pipeline is ready.{' '}
                <button
                  type="button"
                  onClick={onOpenNewJob}
                  className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                >
                  Create your first inquiry
                </button>
                .
              </p>
            </div>
          ) : (
            <div className="flex h-full min-h-0 items-stretch gap-4 md:gap-5">
              {columnGroups.map((group) => (
                <div
                  key={group.key}
                  data-group-key={group.key !== 'all' ? group.key : undefined}
                  ref={
                    group.key !== 'all'
                      ? (element) => setGroupRef(group.key as PipelineGroupKey, element)
                      : undefined
                  }
                  className="flex shrink-0 gap-3 md:gap-4"
                >
                  <div className="flex gap-3 md:gap-4">
                    {group.columns.map((column) => (
                      <KanbanColumn
                        key={column.id}
                        column={column}
                        columns={board.columns}
                        cards={cardsByColumn.get(column.id) ?? []}
                        members={members}
                        role={orgRole}
                        activeCardId={activeCardId}
                        onCreate={onCreate}
                        onOpenCard={onOpenCard}
                        onPatchCard={onPatchCard}
                        onMoveCard={onMoveCard}
                        onArchiveCard={onArchiveCard}
                        isDragTarget={dragOverColumnId === column.id}
                        selectionEnabled={selectionEnabled}
                        selectedCardIds={selectedCardIds}
                        onToggleSelect={onToggleSelect}
                        onSelectAllInColumn={onSelectAllInColumn}
                        onDeleteSelectedInColumn={onDeleteSelectedInColumn}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <BoardCardSurface
              card={activeCard}
              columns={board.columns}
              members={members}
              role={orgRole}
              onOpen={() => undefined}
              onPatch={() => undefined}
              onMove={() => undefined}
              onArchive={() => undefined}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
