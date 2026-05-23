'use client';

import { useState } from 'react';

import type { CardCommentView, CardDetailView } from '@/lib/domain/cards/cardDetail';
import type { QuoteView } from '@/lib/domain/money/quotes';
import type { InvoiceView } from '@/lib/domain/money/invoices';
import type { BoardColumnView } from '@/lib/domain/board/getBoard';
import { canDeleteCard, type OrgRole } from '@/lib/domain/auth/roles';
import { COLUMN_CATEGORY } from '@/lib/domain/pipeline/types';
import type { BoardSyncHandlers, MoveCardResult } from '@/components/pipeline/useBoardState';
import {
  createClientMutationId,
  type EnqueueSidecar,
  type SyncFailureEvent,
} from '@/components/pipeline/useOutboundSync';
import { applyDetailPatch, applyMoneyPatch } from '@/components/card/cardPatchUtils';
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
  const aiContext: AiContext | null =
    userId ?
      {
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
        handleMoveFailure({ mutation: { kind: 'moveCard', cardId } as SyncFailureEvent['mutation'], code: result.code, message: result.message });
      }
      return;
    }

    setMovePrompt(null);
    if (!boardSync.queueEnabled) {
      setPayload((current) =>
        current ?
          {
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
              current ?
                {
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
        current ?
          {
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

  const draftEstimateFromAi = async () => {
    if (!aiContext) return;

    setAiDraftLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'Draft estimate from scope notes',
          context: { ...aiContext, mode: 'draft' },
        }),
      });
      const responsePayload = await response.json();
      if (!response.ok) {
        throw new Error(responsePayload.error ?? 'AI estimate draft failed.');
      }

      if (responsePayload.data?.status === 'approval_required') {
        setAiApproval(responsePayload.data);
        return;
      }

      await loadCard();
      setTab('estimate');
    } catch (draftError) {
      setError(draftError instanceof Error ? draftError.message : 'AI estimate draft failed.');
    } finally {
      setAiDraftLoading(false);
    }
  };

  const saveQuote = async (
    lineItems: Array<{ description: string; quantity: number; unitPrice: number }>,
  ) => {
    if (!payload) return;

    setSaving(true);
    setError(null);
    const previousPayload = payload;
    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const optimisticQuote = {
      id: payload.quote?.id ?? `temp-quote-${createClientMutationId()}`,
      cardId,
      status: 'draft',
      subtotal,
      tax: 0,
      total: subtotal,
      items: lineItems.map((item, index) => ({
        id: `temp-item-${index}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      })),
    };
    const optimisticPayload = applyMoneyPatch(payload, {
      quote: optimisticQuote,
      cardPatch: { quoteTotal: subtotal },
    });
    setPayload(optimisticPayload);
    boardSync.patchCard(cardId, { moneyBadge: 'estimate_draft', quoteTotal: subtotal });

    if (boardSync.queueEnabled) {
      boardSync.enqueue(
        {
          kind: 'saveQuote',
          clientMutationId: createClientMutationId(),
          cardId,
          lineItems,
          rollback: { payload: previousPayload, boardCards: boardSync.getBoardSnapshot() },
        },
        {
          onSuccess: (data) => {
            if (data && typeof data === 'object' && 'id' in data) {
              setPayload((current) =>
                current ?
                  applyMoneyPatch(current, {
                    quote: data as QuoteView,
                    cardPatch: { quoteTotal: (data as QuoteView).total },
                  })
                : current,
              );
              boardSync.patchCard(cardId, {
                moneyBadge: 'estimate_draft',
                quoteTotal: (data as QuoteView).total,
              });
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
      const response = await fetch(`/api/cards/${cardId}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineItems }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to save estimate.');
      }

      boardSync.patchCard(cardId, { moneyBadge: 'estimate_draft' });
      await loadCard();
      boardSync.endOutboundSync(true);
    } catch (quoteError) {
      const message = quoteError instanceof Error ? quoteError.message : 'Failed to save estimate.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    } finally {
      setSaving(false);
    }
  };

  const markQuoteSent = async () => {
    if (!payload) return;

    setSaving(true);
    setError(null);
    const previousPayload = payload;
    const optimisticPayload = applyMoneyPatch(payload, {
      cardPatch: { quoteTotal: payload.card.quoteTotal },
    });
    setPayload(optimisticPayload);
    boardSync.patchCard(cardId, { moneyBadge: 'estimate_sent' });

    if (boardSync.queueEnabled) {
      boardSync.enqueue(
        {
          kind: 'markQuoteSent',
          clientMutationId: createClientMutationId(),
          cardId,
          rollback: { payload: previousPayload, boardCards: boardSync.getBoardSnapshot() },
        },
        {
          onSuccess: (data) => {
            if (data && typeof data === 'object' && 'id' in data) {
              setPayload((current) =>
                current ?
                  applyMoneyPatch(current, { quote: data as QuoteView })
                : current,
              );
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
      const response = await fetch(`/api/cards/${cardId}/quotes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to mark estimate sent.');
      }

      boardSync.patchCard(cardId, { moneyBadge: 'estimate_sent' });
      await loadCard();
      boardSync.endOutboundSync(true);
    } catch (sentError) {
      const message =
        sentError instanceof Error ? sentError.message : 'Failed to mark estimate sent.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    } finally {
      setSaving(false);
    }
  };

  const createInvoice = async () => {
    if (!payload) return;

    setSaving(true);
    setError(null);
    const previousPayload = payload;
    boardSync.patchCard(cardId, { moneyBadge: 'invoice_draft' });

    if (boardSync.queueEnabled) {
      boardSync.enqueue(
        {
          kind: 'createInvoice',
          clientMutationId: createClientMutationId(),
          cardId,
          fromQuoteId: payload.quote?.id,
          rollback: { payload: previousPayload, boardCards: boardSync.getBoardSnapshot() },
        },
        {
          onSuccess: (data) => {
            if (data && typeof data === 'object') {
              setPayload((current) =>
                current ?
                  applyMoneyPatch(current, { invoice: data as InvoiceView })
                : current,
              );
            }
            setTab('money');
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
      const response = await fetch(`/api/cards/${cardId}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromQuoteId: payload?.quote?.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to create invoice.');
      }

      boardSync.patchCard(cardId, { moneyBadge: 'invoice_draft' });
      await loadCard();
      setTab('money');
      boardSync.endOutboundSync(true);
    } catch (invoiceError) {
      const message = invoiceError instanceof Error ? invoiceError.message : 'Failed to create invoice.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async () => {
    if (!payload?.invoice) return;

    setConfirmAction({
      title: 'Mark invoice paid',
      message: `Mark invoice paid ($${payload.invoice.total.toFixed(2)}) and archive this job?`,
      confirmLabel: 'Mark paid',
      onConfirm: async () => {
        setSaving(true);
        setError(null);
        const previousPayload = payload;
        const archivedColumn = columns.find((column) => column.stateKey === 'archived');
        const optimisticCard =
          archivedColumn ?
            {
              ...payload.card,
              columnId: archivedColumn.id,
              stateKey: archivedColumn.stateKey,
              columnCategory: COLUMN_CATEGORY[archivedColumn.stateKey] ?? 'sales',
            }
          : payload.card;
        const optimisticPayload = applyMoneyPatch(
          { ...payload, card: optimisticCard },
          {
            invoice: { ...payload.invoice!, status: 'paid' },
          },
        );
        setPayload(optimisticPayload);
        boardSync.syncFromDetail(optimisticCard);
        boardSync.patchCard(cardId, { moneyBadge: 'paid' });

        if (boardSync.queueEnabled) {
          boardSync.enqueue(
            {
              kind: 'markPaid',
              clientMutationId: createClientMutationId(),
              cardId,
              invoiceId: payload.invoice!.id,
              rollback: { payload: previousPayload, boardCards: boardSync.getBoardSnapshot() },
            },
            {
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
          const response = await fetch(`/api/invoices/${payload.invoice!.id}/mark-paid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: 'manual' }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error ?? 'Failed to mark paid.');
          }

          await loadCard(true);
          boardSync.endOutboundSync(true);
        } catch (paidError) {
          const message = paidError instanceof Error ? paidError.message : 'Failed to mark paid.';
          setError(message);
          boardSync.endOutboundSync(false, message);
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const createPaymentLink = async () => {
    if (!payload?.invoice) return;

    setSaving(true);
    setError(null);
    const previousPayload = payload;

    if (boardSync.queueEnabled) {
      boardSync.enqueue(
        {
          kind: 'createPaymentLink',
          clientMutationId: createClientMutationId(),
          cardId,
          invoiceId: payload.invoice.id,
          rollback: { payload: previousPayload, boardCards: boardSync.getBoardSnapshot() },
        },
        {
          onSuccess: () => {
            void loadCard();
          },
          onFailure: () => setPayload(previousPayload),
        },
      );
      setSaving(false);
      return;
    }

    boardSync.beginOutboundSync();

    try {
      const response = await fetch(`/api/invoices/${payload.invoice.id}/payment-link`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to create payment link.');
      }

      await loadCard();
      boardSync.endOutboundSync(true);
    } catch (linkError) {
      const message =
        linkError instanceof Error ? linkError.message : 'Failed to create payment link.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    } finally {
      setSaving(false);
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
          const message = deleteError instanceof Error ? deleteError.message : 'Failed to delete job.';
          setError(message);
          boardSync.endOutboundSync(false, message);
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const canDelete = canDeleteCard(role as OrgRole);

  const copyPortalLink = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/cards/${cardId}/portal-token`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to create portal link.');
      }

      const url = data.data?.portalUrl as string | undefined;
      if (!url) {
        throw new Error('Portal link was not returned.');
      }

      await navigator.clipboard.writeText(url);
      setError(null);
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : 'Failed to copy portal link.');
    } finally {
      setSaving(false);
    }
  };

  const exportEstimate = () => {
    window.open(`/api/cards/${cardId}/quotes/export`, '_blank', 'noopener,noreferrer');
  };

  const sendEstimate = async (email: string) => {
    if (!payload) return;

    setSaving(true);
    setError(null);
    setSendEstimateError(null);
    const previousPayload = payload;
    boardSync.patchCard(cardId, { moneyBadge: 'estimate_sent' });

    if (boardSync.queueEnabled) {
      boardSync.enqueue(
        {
          kind: 'sendEstimate',
          clientMutationId: createClientMutationId(),
          cardId,
          email,
          rollback: { payload: previousPayload, boardCards: boardSync.getBoardSnapshot() },
        },
        {
          onFailure: () => {
            setPayload(previousPayload);
            boardSync.syncFromDetail(previousPayload.card);
            setSendEstimateError('Failed to send estimate.');
          },
        },
      );
      setSendEstimateOpen(false);
      setSaving(false);
      return;
    }

    boardSync.beginOutboundSync();

    try {
      const response = await fetch(`/api/cards/${cardId}/quotes/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to send estimate.');
      }

      boardSync.patchCard(cardId, { moneyBadge: 'estimate_sent' });
      await loadCard();
      boardSync.endOutboundSync(true);
      setSendEstimateOpen(false);
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Failed to send estimate.';
      setSendEstimateError(message);
      boardSync.endOutboundSync(false, message);
    } finally {
      setSaving(false);
    }
  };

  const openSendEstimateModal = async () => {
    setSendEstimateError(null);
    setSendEstimateOpen(true);
  };

  const createChangeOrder = async () => {
    setSaving(true);
    setError(null);
    const previousPayload = payload;

    if (boardSync.queueEnabled && payload) {
      boardSync.enqueue(
        {
          kind: 'createChangeOrder',
          clientMutationId: createClientMutationId(),
          cardId,
          title: 'Change order',
          rollback: { payload: previousPayload, boardCards: boardSync.getBoardSnapshot() },
        },
        {
          onSuccess: (data) => {
            if (data && typeof data === 'object' && 'id' in data) {
              const order = data as { id: string; title: string };
              setPayload((current) => current);
              void loadCard();
            }
          },
          onFailure: () => {
            if (previousPayload) setPayload(previousPayload);
          },
        },
      );
      setSaving(false);
      return;
    }

    boardSync.beginOutboundSync();

    try {
      const response = await fetch(`/api/cards/${cardId}/change-orders`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to create change order.');
      }

      await loadCard();
      boardSync.endOutboundSync(true);
    } catch (orderError) {
      const message =
        orderError instanceof Error ? orderError.message : 'Failed to create change order.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    } finally {
      setSaving(false);
    }
  };

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
    draftEstimateFromAi,
    saveQuote,
    markQuoteSent,
    createInvoice,
    markPaid,
    createPaymentLink,
    copyJobLink,
    archiveJob,
    deleteJob,
    copyPortalLink,
    exportEstimate,
    sendEstimate,
    openSendEstimateModal,
    createChangeOrder,
  };
}
