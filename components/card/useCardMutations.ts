'use client';

import { useState } from 'react';

import type { CardCommentView, CardDetailView } from '@/lib/domain/cards/cardDetail';
import type { BoardColumnView } from '@/lib/domain/board/getBoard';
import { canDeleteCard, type OrgRole } from '@/lib/domain/auth/roles';
import { COLUMN_CATEGORY } from '@/lib/domain/pipeline/types';
import type { BoardSyncHandlers, MoveCardResult } from '@/components/pipeline/useBoardState';
import {
  createClientMutationId,
  type EnqueueSidecar,
  type SyncFailureEvent,
} from '@/components/pipeline/useOutboundSync';
import { applyDetailPatch } from '@/components/card/cardPatchUtils';
import { useCardMoneyMutations } from '@/components/card/useCardMoneyMutations';
import type { CardPayload } from '@/components/card/useCardDetail';

type TabKey =
  | 'overview'
  | 'property'
  | 'scope'
  | 'schedule'
  | 'comments'
  | 'checklist'
  | 'estimate'
  | 'money'
  | 'comms'
  | 'files';

type AiContext = {
  page: 'card';
  organizationId: string;
  userId: string;
  role: string;
  selectedCardId: string;
};

export function useCardMutations({
  cardId,
  columns,
  role,
  organizationId,
  userId,
  onClose,
  boardSync,
  onMoveCard,
  payload,
  setPayload,
  setError,
  loadCard,
  setTab,
}: {
  cardId: string;
  columns: BoardColumnView[];
  role: string;
  organizationId: string;
  userId: string | null;
  onClose: () => void;
  boardSync: BoardSyncHandlers;
  onMoveCard: (
    cardId: string,
    targetColumnId: string,
    extras?: { reason?: string },
    sidecar?: EnqueueSidecar,
  ) => Promise<MoveCardResult>;
  payload: CardPayload | null;
  setPayload: React.Dispatch<React.SetStateAction<CardPayload | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  loadCard: (syncBoard?: boolean) => Promise<void>;
  setTab: React.Dispatch<React.SetStateAction<TabKey>>;
}) {
  const [saving, setSaving] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [movePrompt, setMovePrompt] = useState<{
    targetColumnId: string;
    type: 'schedule' | 'reason' | 'error';
    message: string;
  } | null>(null);
  const [aiApproval, setAiApproval] = useState<{
    toolCallId: string;
    toolName: string;
    preview: { summary: string; input: Record<string, unknown> };
    message: string;
  } | null>(null);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    confirmVariant?: 'primary' | 'danger';
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [sendEstimateOpen, setSendEstimateOpen] = useState(false);
  const [sendEstimateError, setSendEstimateError] = useState<string | null>(null);

  const card = payload?.card;
  const aiContext: AiContext | null = userId
    ? {
        page: 'card',
        organizationId,
        userId,
        role,
        selectedCardId: cardId,
      }
    : null;

  const patchCard = async (patch: Record<string, unknown>) => {
    if (!payload) {
      return;
    }

    const previousPayload = payload;
    const optimisticCard = applyDetailPatch(payload.card, patch);
    setPayload({ ...payload, card: optimisticCard });
    boardSync.syncFromDetail(optimisticCard);
    setError(null);

    if (boardSync.queueEnabled) {
      boardSync.enqueue(
        {
          kind: 'patchDetail',
          clientMutationId: createClientMutationId(),
          cardId,
          patch,
          rollback: { payload: previousPayload },
        },
        {
          onSuccess: (data) => {
            if (data && typeof data === 'object' && 'id' in data) {
              const detail = data as CardDetailView;
              setPayload((current) => (current ? { ...current, card: detail } : current));
              boardSync.syncFromDetail(detail);
            }
          },
          onFailure: () => {
            setPayload(previousPayload);
            boardSync.syncFromDetail(previousPayload.card);
          },
        },
      );
      return;
    }

    boardSync.beginOutboundSync();

    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to save.');
      }

      setPayload((current) => (current ? { ...current, card: data.data } : current));
      boardSync.syncFromDetail(data.data);
      boardSync.endOutboundSync(true);
    } catch (patchError) {
      setPayload(previousPayload);
      boardSync.syncFromDetail(previousPayload.card);
      const message = patchError instanceof Error ? patchError.message : 'Failed to save.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    }
  };

  const saveCustomer = async (form: FormData) => {
    if (!payload) {
      return;
    }

    const previousPayload = payload;
    const optimisticCard: CardDetailView = {
      ...payload.card,
      customer: {
        id: payload.card.customer?.id ?? 'temp-customer',
        name: String(form.get('name') ?? ''),
        phone: (form.get('phone') as string) || null,
        email: (form.get('email') as string) || null,
        address: (form.get('address') as string) || null,
        notes: (form.get('notes') as string) || null,
      },
      updatedAt: new Date().toISOString(),
    };

    setPayload({ ...payload, card: optimisticCard });
    boardSync.syncFromDetail(optimisticCard);
    setSaving(true);
    setError(null);

    if (boardSync.queueEnabled) {
      boardSync.enqueue(
        {
          kind: 'saveCustomer',
          clientMutationId: createClientMutationId(),
          cardId,
          body: {
            name: String(form.get('name') ?? ''),
            phone: (form.get('phone') as string) || null,
            email: (form.get('email') as string) || null,
            address: (form.get('address') as string) || null,
            notes: (form.get('notes') as string) || null,
          },
          rollback: { payload: previousPayload },
        },
        {
          onSuccess: (data) => {
            if (data && typeof data === 'object' && 'id' in data) {
              const detail = data as CardDetailView;
              setPayload((current) => (current ? { ...current, card: detail } : current));
              boardSync.syncFromDetail(detail);
            }
          },
          onFailure: () => {
            setPayload(previousPayload);
            boardSync.syncFromDetail(previousPayload.card);
          },
        },
      );
      setSaving(false);
      return;
    }

    boardSync.beginOutboundSync();

    try {
      const response = await fetch(`/api/cards/${cardId}/customer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          phone: form.get('phone') || null,
          email: form.get('email') || null,
          address: form.get('address') || null,
          notes: form.get('notes') || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to save customer.');
      }

      setPayload((current) => (current ? { ...current, card: data.data } : current));
      boardSync.syncFromDetail(data.data);
      boardSync.endOutboundSync(true);
    } catch (customerError) {
      setPayload(previousPayload);
      boardSync.syncFromDetail(previousPayload.card);
      const message =
        customerError instanceof Error ? customerError.message : 'Failed to save customer.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    } finally {
      setSaving(false);
    }
  };

  const attemptMove = async (
    targetColumnId: string,
    extras?: { reason?: string; scheduledStart?: string },
  ) => {
    if (extras?.scheduledStart) {
      await patchCard({ scheduledStart: extras.scheduledStart });
    }

    if (!payload) {
      return;
    }

    const targetColumn = columns.find((column) => column.id === targetColumnId);
    if (!targetColumn) {
      return;
    }

    const previousPayload = payload;
    const optimisticCard: CardDetailView = {
      ...payload.card,
      columnId: targetColumnId,
      stateKey: targetColumn.stateKey,
      columnCategory: COLUMN_CATEGORY[targetColumn.stateKey] ?? 'sales',
      updatedAt: new Date().toISOString(),
    };

    setPayload({ ...payload, card: optimisticCard });
    setError(null);

    const handleMoveFailure = (event: SyncFailureEvent) => {
      setPayload(previousPayload);
      const code = event.code;
      const message = event.message;

      if (code === 'SCHEDULE_REQUIRED') {
        setMovePrompt({ targetColumnId, type: 'schedule', message });
        return;
      }

      if (code === 'ESTIMATE_REQUIRED') {
        setTab('estimate');
        setMovePrompt({ targetColumnId, type: 'error', message });
        return;
      }

      if (
        code === 'VALIDATION_ERROR' &&
        (message.toLowerCase().includes('reason') || message.toLowerCase().includes('balance'))
      ) {
        setMovePrompt({ targetColumnId, type: 'reason', message });
        return;
      }

      setMovePrompt({ targetColumnId, type: 'error', message });
    };

    const result = await onMoveCard(
      cardId,
      targetColumnId,
      { reason: extras?.reason },
      boardSync.queueEnabled ? { onFailure: handleMoveFailure } : undefined,
    );

    if (!result.ok) {
      if (!boardSync.queueEnabled) {
        handleMoveFailure({
          mutation: { kind: 'moveCard', cardId } as SyncFailureEvent['mutation'],
          code: result.code,
          message: result.message,
        });
      }
      return;
    }

    setMovePrompt(null);
    if (!boardSync.queueEnabled) {
      setPayload((current) =>
        current
          ? {
              ...current,
              card: {
                ...current.card,
                columnId: result.card.columnId,
                stateKey: result.card.stateKey,
                columnCategory: result.card.columnCategory,
                updatedAt: result.card.updatedAt,
              },
            }
          : current,
      );
    }
  };

  const addComment = async () => {
    if (!commentDraft.trim() || !payload) {
      return;
    }

    const body = commentDraft.trim();
    const optimisticComment: CardCommentView = {
      id: `temp-${crypto.randomUUID()}`,
      body,
      authorName: 'You',
      createdAt: new Date().toISOString(),
    };

    const previousPayload = payload;
    setPayload({
      ...payload,
      comments: [optimisticComment, ...payload.comments],
    });
    setCommentDraft('');
    setError(null);

    if (boardSync.queueEnabled) {
      boardSync.enqueue(
        {
          kind: 'addComment',
          clientMutationId: createClientMutationId(),
          cardId,
          body,
          tempCommentId: optimisticComment.id,
          rollback: { payload: previousPayload },
        },
        {
          onSuccess: (data) => {
            setPayload((current) =>
              current
                ? {
                    ...current,
                    comments: [
                      data as CardCommentView,
                      ...current.comments.filter((comment) => comment.id !== optimisticComment.id),
                    ],
                  }
                : current,
            );
          },
          onFailure: () => {
            setPayload(previousPayload);
            setCommentDraft(body);
          },
        },
      );
      return;
    }

    boardSync.beginOutboundSync();

    try {
      const response = await fetch(`/api/cards/${cardId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to add comment.');
      }

      setPayload((current) =>
        current
          ? {
              ...current,
              comments: [
                data.data as CardCommentView,
                ...current.comments.filter((comment) => comment.id !== optimisticComment.id),
              ],
            }
          : current,
      );
      boardSync.endOutboundSync(true);
    } catch (commentError) {
      setPayload(previousPayload);
      setCommentDraft(body);
      const message =
        commentError instanceof Error ? commentError.message : 'Failed to add comment.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    }
  };

  const copyJobLink = async () => {
    const url = `${window.location.origin}/pipeline?card=${cardId}`;
    await navigator.clipboard.writeText(url);
  };

  const archiveJob = async () => {
    const archivedColumn = columns.find((column) => column.stateKey === 'archived');
    if (!archivedColumn) {
      setError('Archived column not found.');
      return;
    }
    await attemptMove(archivedColumn.id);
  };

  const deleteJob = async () => {
    if (!card) return;

    setConfirmAction({
      title: 'Delete job',
      message: `Delete "${card.title}" permanently? This removes comments, estimates, and invoices for this job.`,
      confirmLabel: 'Delete job',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setSaving(true);
        setError(null);
        const previousCards = boardSync.getBoardSnapshot();
        boardSync.removeCard(cardId);
        onClose();

        if (boardSync.queueEnabled) {
          boardSync.enqueue(
            {
              kind: 'deleteCard',
              clientMutationId: createClientMutationId(),
              cardId,
              rollback: { cards: previousCards },
            },
            {
              onFailure: () => {
                setError('Failed to delete job.');
              },
            },
          );
          setSaving(false);
          return;
        }

        boardSync.beginOutboundSync();

        try {
          const response = await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error ?? 'Failed to delete job.');
          }

          boardSync.removeCard(cardId);
          boardSync.endOutboundSync(true);
          onClose();
        } catch (deleteError) {
          const message =
            deleteError instanceof Error ? deleteError.message : 'Failed to delete job.';
          setError(message);
          boardSync.endOutboundSync(false, message);
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const canDelete = canDeleteCard(role as OrgRole);

  const money = useCardMoneyMutations({
    cardId,
    columns,
    role,
    organizationId,
    userId,
    onClose,
    boardSync,
    onMoveCard,
    payload,
    setPayload,
    setError,
    loadCard,
    setTab,
    saving,
    setSaving,
    setConfirmAction,
    aiContext,
    aiApproval,
    setAiApproval,
    setAiDraftLoading,
    sendEstimateOpen,
    setSendEstimateOpen,
    sendEstimateError,
    setSendEstimateError,
  });

  return {
    saving,
    commentDraft,
    setCommentDraft,
    movePrompt,
    setMovePrompt,
    aiApproval,
    setAiApproval,
    aiDraftLoading,
    confirmAction,
    setConfirmAction,
    sendEstimateOpen,
    setSendEstimateOpen,
    sendEstimateError,
    setSendEstimateError,
    aiContext,
    canDelete,
    patchCard,
    saveCustomer,
    attemptMove,
    addComment,
    copyJobLink,
    archiveJob,
    deleteJob,
    ...money,
  };
}
