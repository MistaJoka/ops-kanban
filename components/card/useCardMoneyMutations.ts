'use client';

import type { QuoteView } from '@/lib/domain/money/quotes';
import type { InvoiceView } from '@/lib/domain/money/invoices';
import { COLUMN_CATEGORY } from '@/lib/domain/pipeline/types';
import { createClientMutationId } from '@/components/pipeline/useOutboundSync';
import { applyMoneyPatch } from '@/components/card/cardPatchUtils';
import type { CardMutationsDeps, CardAiContext } from '@/components/card/card-mutations/types';

export function useCardMoneyMutations(
  deps: CardMutationsDeps & {
    aiContext: CardAiContext | null;
    aiApproval: {
      toolCallId: string;
      toolName: string;
      preview: { summary: string; input: Record<string, unknown> };
      message: string;
    } | null;
    setAiApproval: React.Dispatch<
      React.SetStateAction<{
        toolCallId: string;
        toolName: string;
        preview: { summary: string; input: Record<string, unknown> };
        message: string;
      } | null>
    >;
    setAiDraftLoading: React.Dispatch<React.SetStateAction<boolean>>;
    sendEstimateOpen: boolean;
    setSendEstimateOpen: React.Dispatch<React.SetStateAction<boolean>>;
    sendEstimateError: string | null;
    setSendEstimateError: React.Dispatch<React.SetStateAction<string | null>>;
  },
) {
  const {
    cardId,
    columns,
    payload,
    setPayload,
    setError,
    loadCard,
    setTab,
    boardSync,
    saving,
    setSaving,
    setConfirmAction,
    aiContext,
    setAiApproval,
    setAiDraftLoading,
    sendEstimateOpen,
    setSendEstimateOpen,
    sendEstimateError,
    setSendEstimateError,
  } = deps;

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
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
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
                current
                  ? applyMoneyPatch(current, {
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
                current ? applyMoneyPatch(current, { quote: data as QuoteView }) : current,
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
                current ? applyMoneyPatch(current, { invoice: data as InvoiceView }) : current,
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
      const message =
        invoiceError instanceof Error ? invoiceError.message : 'Failed to create invoice.';
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
        const optimisticCard = archivedColumn
          ? {
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
    draftEstimateFromAi,
    saveQuote,
    markQuoteSent,
    createInvoice,
    markPaid,
    createPaymentLink,
    copyPortalLink,
    exportEstimate,
    sendEstimate,
    openSendEstimateModal,
    createChangeOrder,
  };
}
