'use client';

import { canDeleteCard, type OrgRole } from '@/lib/domain/auth/roles';
import type { BoardView } from '@/lib/domain/board/getBoard';
import { PipelineSearchProvider } from '@/components/pipeline/PipelineSearchProvider';
import { useBoardState } from '@/components/pipeline/useBoardState';
import { KanbanBoardToolbar } from '@/components/pipeline/kanban-board/KanbanBoardToolbar';
import { KanbanBoardAiChrome } from '@/components/pipeline/kanban-board/KanbanBoardAiChrome';
import { KanbanBoardModals } from '@/components/pipeline/kanban-board/KanbanBoardModals';
import { KanbanBoardDndArea } from '@/components/pipeline/kanban-board/KanbanBoardDndArea';
import { useKanbanBoardController } from '@/components/pipeline/kanban-board/useKanbanBoardController';

export function KanbanBoard(props: {
  initialBoard: BoardView;
  role: string;
  organizationId: string;
  userId: string | null;
}) {
  return (
    <PipelineSearchProvider>
      <KanbanBoardContent {...props} />
    </PipelineSearchProvider>
  );
}

function KanbanBoardContent({
  initialBoard,
  role,
  organizationId,
  userId,
}: {
  initialBoard: BoardView;
  role: string;
  organizationId: string;
  userId: string | null;
}) {
  const boardState = useBoardState(initialBoard);
  const { moveCard, syncStatus } = boardState;
  const ctrl = useKanbanBoardController(boardState, organizationId, userId, role);
  const orgRole = role as OrgRole;
  const selectionEnabled = canDeleteCard(orgRole);

  return (
    <div className="ops-pipeline-root">
      <KanbanBoardToolbar
        filteredCount={ctrl.filteredCards.length}
        visibleColumnCount={ctrl.visibleColumns.length}
        pipelineMode={ctrl.board.pipelineMode}
        syncStatus={syncStatus}
        onRetrySync={ctrl.boardSync.retryFailedSync}
        pipelineModePending={ctrl.pipelineModePending}
        onTogglePipelineMode={ctrl.togglePipelineMode}
        filterKey={ctrl.filterKey}
        onFilterKeyChange={ctrl.setFilterKey}
        jobTypeFilter={ctrl.jobTypeFilter}
        onJobTypeFilterChange={ctrl.setJobTypeFilter}
        search={ctrl.search}
        onSearchChange={ctrl.setSearch}
        searchInputRef={(element) => {
          ctrl.searchInputRef.current = element;
          ctrl.pipelineSearch?.registerSearchInput(element);
        }}
        showAiButton={Boolean(ctrl.aiContext)}
        onOpenAiCopilot={() => ctrl.setAiCopilotOpen(true)}
        role={orgRole}
        onCreateJob={ctrl.openNewJobModal}
        error={ctrl.error}
      />

      <KanbanBoardAiChrome
        inlinePrompt={
          ctrl.inlinePrompt
            ? { message: ctrl.inlinePrompt.message, actionLabel: ctrl.inlinePrompt.actionLabel }
            : null
        }
        onInlineAction={() => void ctrl.runInlineAi()}
        onDismissInline={() => ctrl.setInlinePrompt(null)}
        toolbarAiContext={ctrl.toolbarAiContext}
        aiCopilotOpen={ctrl.aiCopilotOpen}
        onCloseCopilot={() => ctrl.setAiCopilotOpen(false)}
        onRefresh={ctrl.refreshBoard}
        aiContext={ctrl.aiContext}
        aiDockExpanded={ctrl.aiDockExpanded}
        onAiDockExpandedChange={ctrl.setAiDockExpanded}
      />

      {ctrl.showNoMatches ? (
        <div role="status" className="ops-empty-state mx-4 mt-2">
          {ctrl.filterKey === 'archived'
            ? 'No archived jobs match your search.'
            : ctrl.filterKey !== 'all'
              ? `No ${ctrl.filterLabel} jobs match your search.`
              : 'No jobs match your search.'}
        </div>
      ) : null}

      <KanbanBoardDndArea
        sensors={ctrl.sensors}
        showGroupJump={ctrl.board.pipelineMode === 'full' && !ctrl.includeArchived}
        activeGroup={ctrl.activeGroup}
        onJumpGroup={(key) => {
          ctrl.setActiveGroup(key);
          ctrl.pipelineSearch?.scrollToGroup(key);
        }}
        onDragStart={ctrl.handleDragStart}
        onDragOver={ctrl.handleDragOver}
        onDragEnd={(event) => void ctrl.handleDragEnd(event)}
        onDragCancel={ctrl.handleDragCancel}
        setBoardScrollRef={ctrl.setBoardScrollRef}
        setGroupRef={ctrl.setGroupRef}
        showEmptyBoard={ctrl.showEmptyBoard}
        onOpenNewJob={() => ctrl.openNewJobModal()}
        columnGroups={ctrl.columnGroups}
        board={ctrl.board}
        cardsByColumn={ctrl.cardsByColumn}
        members={ctrl.members}
        orgRole={orgRole}
        activeCardId={ctrl.activeCardId}
        activeCard={ctrl.activeCard}
        onCreate={ctrl.openNewJobModal}
        onOpenCard={ctrl.openCard}
        onPatchCard={ctrl.handlePatchCard}
        onMoveCard={ctrl.handleMoveCard}
        onArchiveCard={ctrl.handleArchiveCard}
        dragOverColumnId={ctrl.dragOverColumnId}
        selectionEnabled={selectionEnabled}
        selectedCardIds={ctrl.selectedCardIds}
        onToggleSelect={ctrl.toggleCardSelection}
        onSelectAllInColumn={ctrl.selectAllInColumn}
        onDeleteSelectedInColumn={ctrl.requestDeleteSelectedInColumn}
      />

      <KanbanBoardModals
        board={ctrl.board}
        role={role}
        organizationId={organizationId}
        userId={userId}
        boardSync={ctrl.boardSync}
        onMoveCard={moveCard}
        selectedCardId={ctrl.selectedCardId}
        onCloseCard={ctrl.closeCard}
        newJobModal={ctrl.newJobModal}
        newJobPending={ctrl.newJobPending}
        newJobError={ctrl.newJobError}
        onCloseNewJob={ctrl.closeNewJobModal}
        onNewJobSubmit={ctrl.handleNewJobSubmit}
        bulkDeleteConfirm={ctrl.bulkDeleteConfirm}
        bulkDeletePending={ctrl.bulkDeletePending}
        onCancelBulkDelete={() => {
          if (!ctrl.bulkDeletePending) ctrl.setBulkDeleteConfirm(null);
        }}
        onConfirmBulkDelete={() => void ctrl.confirmBulkDelete()}
      />
    </div>
  );
}
