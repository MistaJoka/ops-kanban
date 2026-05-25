'use client';

import { CardPanel } from '@/components/card/CardPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { NewJobModal, type NewJobFormValues } from '@/components/pipeline/NewJobModal';
import type { BoardView } from '@/lib/domain/board/getBoard';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import type { BoardSyncHandlers } from '@/components/pipeline/useBoardState';
import type { MoveCardResult } from '@/components/pipeline/useBoardState';

type Props = {
  board: BoardView;
  role: string;
  organizationId: string;
  userId: string | null;
  boardSync: BoardSyncHandlers;
  onMoveCard: (
    cardId: string,
    targetColumnId: string,
    extras?: { reason?: string },
  ) => Promise<MoveCardResult>;
  selectedCardId: string | null;
  onCloseCard: () => void;
  newJobModal: { defaultColumnId?: string } | null;
  newJobPending: boolean;
  newJobError: string | null;
  onCloseNewJob: () => void;
  onNewJobSubmit: (values: NewJobFormValues, openAfterCreate: boolean) => void;
  bulkDeleteConfirm: { cardIds: string[] } | null;
  bulkDeletePending: boolean;
  onCancelBulkDelete: () => void;
  onConfirmBulkDelete: () => void;
};

export function KanbanBoardModals({
  board,
  role,
  organizationId,
  userId,
  boardSync,
  onMoveCard,
  selectedCardId,
  onCloseCard,
  newJobModal,
  newJobPending,
  newJobError,
  onCloseNewJob,
  onNewJobSubmit,
  bulkDeleteConfirm,
  bulkDeletePending,
  onCancelBulkDelete,
  onConfirmBulkDelete,
}: Props) {
  return (
    <>
      {newJobModal ? (
        <NewJobModal
          columns={board.columns}
          defaultColumnId={newJobModal.defaultColumnId}
          pending={newJobPending}
          error={newJobError}
          onClose={onCloseNewJob}
          onSubmit={onNewJobSubmit}
        />
      ) : null}

      {bulkDeleteConfirm ? (
        <ConfirmModal
          title="Delete jobs"
          message={`Delete ${bulkDeleteConfirm.cardIds.length} job${
            bulkDeleteConfirm.cardIds.length === 1 ? '' : 's'
          } permanently? This removes comments, estimates, and invoices for each job.`}
          confirmLabel="Delete jobs"
          confirmVariant="danger"
          pending={bulkDeletePending}
          onCancel={onCancelBulkDelete}
          onConfirm={onConfirmBulkDelete}
        />
      ) : null}

      {selectedCardId ? (
        <ErrorBoundary surface="card-panel" onReset={onCloseCard}>
          <CardPanel
            cardId={selectedCardId}
            columns={board.columns}
            role={role}
            organizationId={organizationId}
            userId={userId}
            onClose={onCloseCard}
            boardSync={boardSync}
            onMoveCard={onMoveCard}
            initialBoardCard={
              board.cards.find((card) => card.id === selectedCardId) as BoardCardView | undefined
            }
          />
        </ErrorBoundary>
      ) : null}
    </>
  );
}
