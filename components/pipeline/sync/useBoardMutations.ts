import type { BoardView } from '@/lib/domain/board/getBoard';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import {
  boardCardFromDetail,
  boardCardMovePatch,
  createOptimisticBoardCard,
  isTempCardId,
  nextCardPosition,
  removeBoardCardById,
  reorderBoardCards,
  replaceBoardCard,
  tempCardId,
} from '@/lib/domain/board/boardOptimistic';
import type { OutboundMutation } from '@/lib/domain/board/outboundSyncQueue';
import {
  createClientMutationId,
  type EnqueueSidecar,
  type OutboundSyncApi,
} from '@/components/pipeline/useOutboundSync';
import type {
  CreateCardDetails,
  CreateCardWithDetailsResult,
  MoveCardResult,
  ReorderCardResult,
} from '@/components/pipeline/useBoardState';

type BoardMutationDeps = {
  boardRef: React.MutableRefObject<BoardView>;
  setBoard: React.Dispatch<React.SetStateAction<BoardView>>;
  upsertCard: (card: BoardCardView) => void;
  syncFromDetail: (detail: import('@/lib/domain/cards/cardDetail').CardDetailView) => void;
  queueEnabled: boolean;
  outboundSync: OutboundSyncApi;
  beginMutation: () => void;
  endMutation: (success: boolean, message?: string) => void;
  showError: (message: string) => void;
  refreshBoard: (includeArchived?: boolean) => Promise<void>;
  setPipelineModePending: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
};

export function createReapplyFailedMutation(deps: {
  getBoard: () => BoardView;
  upsertCard: (card: BoardCardView) => void;
  patchCard: (cardId: string, patch: Partial<BoardCardView>) => void;
  removeCard: (cardId: string) => void;
  restoreBoard: (cards: BoardCardView[]) => void;
}) {
  return (mutation: OutboundMutation) => {
    const currentBoard = deps.getBoard();

    switch (mutation.kind) {
      case 'createCard': {
        const targetColumn = currentBoard.columns.find(
          (column) => column.id === mutation.body.columnId,
        );
        if (!targetColumn) {
          return;
        }

        deps.upsertCard(
          createOptimisticBoardCard({
            id: mutation.clientId,
            title: mutation.body.title,
            columnId: mutation.body.columnId,
            stateKey: targetColumn.stateKey,
            position: nextCardPosition(currentBoard.cards, mutation.body.columnId),
          }),
        );
        break;
      }
      case 'moveCard': {
        const card = currentBoard.cards.find((item) => item.id === mutation.cardId);
        const targetColumn = currentBoard.columns.find(
          (column) => column.id === mutation.targetColumnId,
        );
        if (!card || !targetColumn) {
          return;
        }

        deps.upsertCard(boardCardMovePatch(card, targetColumn));
        break;
      }
      case 'reorderCard':
        deps.restoreBoard(
          reorderBoardCards(
            currentBoard.cards,
            mutation.cardId,
            mutation.targetColumnId,
            mutation.insertIndex,
            currentBoard.columns,
          ),
        );
        break;
      case 'patchCard': {
        const patch: Partial<BoardCardView> = {};
        if (mutation.patch.title !== undefined) {
          patch.title = String(mutation.patch.title);
        }
        if (mutation.patch.dueDate !== undefined) {
          patch.dueDate = mutation.patch.dueDate === null ? null : String(mutation.patch.dueDate);
        }
        if (mutation.patch.assignedTo !== undefined) {
          patch.assignedTo =
            mutation.patch.assignedTo === null ? null : String(mutation.patch.assignedTo);
        }
        if (Object.keys(patch).length > 0) {
          deps.patchCard(mutation.cardId, patch);
        }
        break;
      }
      case 'deleteCard':
        deps.removeCard(mutation.cardId);
        break;
      default:
        break;
    }
  };
}

export function useBoardMutations(deps: BoardMutationDeps) {
  const {
    boardRef,
    setBoard,
    upsertCard,
    syncFromDetail,
    queueEnabled,
    outboundSync,
    beginMutation,
    endMutation,
    showError,
    refreshBoard,
    setPipelineModePending,
    setError,
  } = deps;

  const createCardWithDetails = async (
    details: CreateCardDetails,
  ): Promise<CreateCardWithDetailsResult> => {
    const title = details.title.trim();
    if (!title) {
      return { ok: false, message: 'Title is required.' };
    }

    const currentBoard = boardRef.current;
    const targetColumnId =
      details.columnId ??
      currentBoard.columns.find((column) => column.stateKey === 'inquiry')?.id ??
      currentBoard.columns[0]?.id;

    if (!targetColumnId) {
      const message = 'No column available for new jobs.';
      showError(message);
      return { ok: false, message };
    }

    const targetColumn = currentBoard.columns.find((column) => column.id === targetColumnId);
    if (!targetColumn) {
      const message = 'Column not found.';
      showError(message);
      return { ok: false, message };
    }

    const optimisticId = tempCardId();
    const optimisticCard = createOptimisticBoardCard({
      id: optimisticId,
      title,
      columnId: targetColumnId,
      stateKey: targetColumn.stateKey,
      position: nextCardPosition(currentBoard.cards, targetColumnId),
    });

    const previousCards = currentBoard.cards;
    upsertCard(optimisticCard);

    if (queueEnabled) {
      outboundSync.enqueue({
        kind: 'createCard',
        clientMutationId: createClientMutationId(),
        clientId: optimisticId,
        body: {
          title,
          columnId: targetColumnId,
          jobType: details.jobType,
          customerName: details.customerName,
          customerAddress: details.customerAddress,
        },
        rollback: { cards: previousCards },
      });
      return { ok: true, card: optimisticCard };
    }

    beginMutation();

    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          columnId: targetColumnId,
          ...(details.jobType ? { jobType: details.jobType } : {}),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to create card.');
      }

      let createdCard = payload.data as BoardCardView;

      if (details.customerName?.trim()) {
        const customerResponse = await fetch(`/api/cards/${createdCard.id}/customer`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: details.customerName.trim(),
            address: details.customerAddress?.trim() || null,
          }),
        });
        const customerPayload = await customerResponse.json();

        if (customerResponse.ok) {
          syncFromDetail(customerPayload.data);
          createdCard = boardCardFromDetail(customerPayload.data, createdCard);
        } else {
          showError(customerPayload.error ?? 'Job created but customer save failed.');
        }
      }

      setBoard((current) => ({
        ...current,
        cards: replaceBoardCard(
          removeBoardCardById(current.cards, optimisticId),
          createdCard.id,
          createdCard,
        ),
      }));
      endMutation(true);
      return { ok: true, card: createdCard };
    } catch (createError) {
      setBoard((current) => ({ ...current, cards: previousCards }));
      const message = createError instanceof Error ? createError.message : 'Failed to create card.';
      showError(message);
      endMutation(false, message);
      return { ok: false, message };
    }
  };

  const moveCard = async (
    cardId: string,
    targetColumnId: string,
    extras?: { reason?: string },
    sidecar?: EnqueueSidecar,
  ): Promise<MoveCardResult> => {
    const currentBoard = boardRef.current;
    const card = currentBoard.cards.find((item) => item.id === cardId);
    if (!card || card.columnId === targetColumnId || isTempCardId(cardId)) {
      return { ok: true, card: card ?? ({} as BoardCardView) };
    }

    const targetColumn = currentBoard.columns.find((column) => column.id === targetColumnId);
    if (!targetColumn) {
      return { ok: false, message: 'Target column not found.' };
    }

    const previousCards = currentBoard.cards;
    const optimisticCard = boardCardMovePatch(card, targetColumn);

    setBoard((current) => ({
      ...current,
      cards: replaceBoardCard(current.cards, cardId, optimisticCard),
    }));

    if (queueEnabled) {
      outboundSync.enqueue(
        {
          kind: 'moveCard',
          clientMutationId: createClientMutationId(),
          cardId,
          targetColumnId,
          reason: extras?.reason,
          rollback: { cards: previousCards },
        },
        sidecar,
      );
      return { ok: true, card: optimisticCard };
    }

    beginMutation();

    try {
      const response = await fetch(`/api/cards/${cardId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetColumnId,
          reason: extras?.reason,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setBoard((current) => ({ ...current, cards: previousCards }));
        endMutation(false, payload.error ?? 'Failed to move card.');
        return {
          ok: false,
          code: payload.code as string | undefined,
          message: payload.error ?? 'Failed to move card.',
        };
      }

      setBoard((current) => ({
        ...current,
        cards: replaceBoardCard(current.cards, cardId, payload.data as BoardCardView),
      }));
      endMutation(true);

      return { ok: true, card: payload.data as BoardCardView };
    } catch (moveError) {
      setBoard((current) => ({ ...current, cards: previousCards }));
      const message = moveError instanceof Error ? moveError.message : 'Failed to move card.';
      showError(message);
      endMutation(false, message);
      return { ok: false, message };
    }
  };

  const reorderCard = async (
    cardId: string,
    targetColumnId: string,
    insertIndex: number,
    extras?: { reason?: string },
  ): Promise<ReorderCardResult> => {
    const currentBoard = boardRef.current;
    const card = currentBoard.cards.find((item) => item.id === cardId);
    if (!card || isTempCardId(cardId)) {
      return { ok: true, card: card ?? ({} as BoardCardView) };
    }

    const targetColumn = currentBoard.columns.find((column) => column.id === targetColumnId);
    if (!targetColumn) {
      return { ok: false, message: 'Target column not found.' };
    }

    const sortedInTarget = currentBoard.cards
      .filter((item) => item.columnId === targetColumnId)
      .sort((a, b) => a.position - b.position);
    const currentIndex = sortedInTarget.findIndex((item) => item.id === cardId);
    const columnCardsWithoutActive = sortedInTarget.filter((item) => item.id !== cardId);
    const clampedIndex = Math.max(0, Math.min(insertIndex, columnCardsWithoutActive.length));

    if (card.columnId === targetColumnId && currentIndex === clampedIndex) {
      return { ok: true, card };
    }

    const previousCards = currentBoard.cards;
    const optimisticCards = reorderBoardCards(
      currentBoard.cards,
      cardId,
      targetColumnId,
      clampedIndex,
      currentBoard.columns,
    );

    setBoard((current) => ({ ...current, cards: optimisticCards }));

    if (queueEnabled) {
      outboundSync.enqueue({
        kind: 'reorderCard',
        clientMutationId: createClientMutationId(),
        cardId,
        targetColumnId,
        insertIndex: clampedIndex,
        crossColumn: card.columnId !== targetColumnId,
        reason: extras?.reason,
        rollback: { cards: previousCards },
      });
      return { ok: true, card: optimisticCards.find((item) => item.id === cardId) ?? card };
    }

    beginMutation();

    try {
      const response = await fetch(`/api/cards/${cardId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(card.columnId !== targetColumnId ? { targetColumnId } : {}),
          insertIndex: clampedIndex,
          reason: extras?.reason,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setBoard((current) => ({ ...current, cards: previousCards }));
        endMutation(false, payload.error ?? 'Failed to reorder card.');
        return {
          ok: false,
          code: payload.code as string | undefined,
          message: payload.error ?? 'Failed to reorder card.',
        };
      }

      setBoard((current) => ({
        ...current,
        cards: replaceBoardCard(current.cards, cardId, payload.data as BoardCardView),
      }));
      endMutation(true);

      return { ok: true, card: payload.data as BoardCardView };
    } catch (reorderError) {
      setBoard((current) => ({ ...current, cards: previousCards }));
      const message =
        reorderError instanceof Error ? reorderError.message : 'Failed to reorder card.';
      showError(message);
      endMutation(false, message);
      return { ok: false, message };
    }
  };

  const togglePipelineMode = async (includeArchived: boolean) => {
    setPipelineModePending(true);
    setError(null);

    try {
      const nextMode = boardRef.current.pipelineMode === 'full' ? 'compact' : 'full';
      const response = await fetch('/api/settings/pipeline-mode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineMode: nextMode }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to update pipeline mode.');
      }
      await refreshBoard(includeArchived);
    } catch (toggleError) {
      const message =
        toggleError instanceof Error ? toggleError.message : 'Failed to update pipeline mode.';
      showError(message);
    } finally {
      setPipelineModePending(false);
    }
  };

  return {
    createCardWithDetails,
    moveCard,
    reorderCard,
    togglePipelineMode,
  };
}
