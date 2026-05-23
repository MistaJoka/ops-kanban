'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import type { CardDetailView } from '@/lib/domain/cards/cardDetail';
import { boardCardFromDetail } from '@/lib/domain/board/boardOptimistic';
import {
  createClientMutationId,
  OutboundSyncQueue,
  type OutboundExecutor,
  type OutboundExecutorResult,
  type OutboundMutation,
} from '@/lib/domain/board/outboundSyncQueue';

export type SyncFailureEvent = {
  mutation: OutboundMutation;
  code?: string;
  message: string;
};

export type EnqueueSidecar = {
  onSuccess?: (data: unknown) => void;
  onFailure?: (event: SyncFailureEvent) => void;
};

export type OutboundSyncApi = {
  enqueue: (mutation: OutboundMutation, sidecar?: EnqueueSidecar) => void;
  flush: (cardId?: string) => void;
  retryFailed: () => boolean;
  queuedCount: number;
  inFlightCount: number;
  hasWork: () => boolean;
  subscribeFailures: (listener: (event: SyncFailureEvent) => void) => () => void;
};

export function isOutboundQueueEnabled(): boolean {
  return process.env.NEXT_PUBLIC_OUTBOUND_QUEUE !== '0';
}

export function createOutboundExecutor(): OutboundExecutor {
  return async (mutation): Promise<OutboundExecutorResult> => {
    const headers = {
      'Content-Type': 'application/json',
      'X-Client-Mutation-Id': mutation.clientMutationId,
    };

    try {
      switch (mutation.kind) {
        case 'createCard': {
          const response = await fetch('/api/cards', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              title: mutation.body.title,
              columnId: mutation.body.columnId,
              ...(mutation.body.jobType ? { jobType: mutation.body.jobType } : {}),
            }),
          });
          const payload = await response.json();
          if (!response.ok) {
            return {
              ok: false,
              message: payload.error ?? 'Failed to create card.',
              retryable: response.status >= 500,
            };
          }

          let createdCard = payload.data as BoardCardView;

          if (mutation.body.customerName?.trim()) {
            const customerResponse = await fetch(`/api/cards/${createdCard.id}/customer`, {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                name: mutation.body.customerName.trim(),
                address: mutation.body.customerAddress?.trim() || null,
              }),
            });
            const customerPayload = await customerResponse.json();
            if (customerResponse.ok) {
              createdCard = boardCardFromDetail(
                customerPayload.data as CardDetailView,
                createdCard,
              );
            }
          }

          return { ok: true, data: createdCard, realCardId: createdCard.id };
        }
        case 'moveCard': {
          const response = await fetch(`/api/cards/${mutation.cardId}/move`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              targetColumnId: mutation.targetColumnId,
              reason: mutation.reason,
            }),
          });
          const payload = await response.json();
          if (!response.ok) {
            return {
              ok: false,
              code: payload.code as string | undefined,
              message: payload.error ?? 'Failed to move card.',
              retryable: response.status >= 500,
            };
          }
          return { ok: true, data: payload.data };
        }
        case 'reorderCard': {
          const response = await fetch(`/api/cards/${mutation.cardId}/reorder`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ...(mutation.crossColumn ? { targetColumnId: mutation.targetColumnId } : {}),
              insertIndex: mutation.insertIndex,
              reason: mutation.reason,
            }),
          });
          const payload = await response.json();
          if (!response.ok) {
            return {
              ok: false,
              code: payload.code as string | undefined,
              message: payload.error ?? 'Failed to reorder card.',
              retryable: response.status >= 500,
            };
          }
          return { ok: true, data: payload.data };
        }
        case 'patchCard':
        case 'patchDetail': {
          const response = await fetch(`/api/cards/${mutation.cardId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(mutation.patch),
          });
          const payload = await response.json();
          if (!response.ok) {
            return {
              ok: false,
              message: payload.error ?? 'Failed to save.',
              retryable: response.status >= 500,
            };
          }
          return { ok: true, data: payload.data as CardDetailView };
        }
        case 'saveCustomer': {
          const response = await fetch(`/api/cards/${mutation.cardId}/customer`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(mutation.body),
          });
          const payload = await response.json();
          if (!response.ok) {
            return {
              ok: false,
              message: payload.error ?? 'Failed to save customer.',
              retryable: response.status >= 500,
            };
          }
          return { ok: true, data: payload.data };
        }
        case 'saveQuote': {
          const response = await fetch(`/api/cards/${mutation.cardId}/quotes`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ lineItems: mutation.lineItems }),
          });
          const payload = await response.json();
          if (!response.ok) {
            return {
              ok: false,
              message: payload.error ?? 'Failed to save estimate.',
              retryable: response.status >= 500,
            };
          }
          return { ok: true, data: payload.data };
        }
        case 'markQuoteSent': {
          const response = await fetch(`/api/cards/${mutation.cardId}/quotes`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: 'sent' }),
          });
          const payload = await response.json();
          if (!response.ok) {
            return {
              ok: false,
              message: payload.error ?? 'Failed to mark estimate sent.',
              retryable: response.status >= 500,
            };
          }
          return { ok: true, data: payload.data };
        }
        case 'sendEstimate': {
          const response = await fetch(`/api/cards/${mutation.cardId}/quotes/send`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ email: mutation.email }),
          });
          const payload = await response.json();
          if (!response.ok) {
            return {
              ok: false,
              message: payload.error ?? 'Failed to send estimate.',
              retryable: response.status >= 500,
            };
          }
          return { ok: true, data: payload.data };
        }
        case 'createInvoice': {
          const response = await fetch(`/api/cards/${mutation.cardId}/invoices`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ fromQuoteId: mutation.fromQuoteId }),
          });
          const payload = await response.json();
          if (!response.ok) {
            return {
              ok: false,
              message: payload.error ?? 'Failed to create invoice.',
              retryable: response.status >= 500,
            };
          }
          return { ok: true, data: payload.data };
        }
        case 'markPaid': {
          const response = await fetch(`/api/invoices/${mutation.invoiceId}/mark-paid`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ method: 'manual' }),
          });
          const payload = await response.json();
          if (!response.ok) {
            return {
              ok: false,
              message: payload.error ?? 'Failed to mark paid.',
              retryable: response.status >= 500,
            };
          }
          return { ok: true, data: payload.data };
        }
        case 'createPaymentLink': {
          const response = await fetch(`/api/invoices/${mutation.invoiceId}/payment-link`, {
            method: 'POST',
            headers,
          });
          const payload = await response.json();
          if (!response.ok) {
            return {
              ok: false,
              message: payload.error ?? 'Failed to create payment link.',
              retryable: response.status >= 500,
            };
          }
          return { ok: true, data: payload.data };
        }
        case 'createChangeOrder': {
          const response = await fetch(`/api/cards/${mutation.cardId}/change-orders`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ title: mutation.title }),
          });
          const payload = await response.json();
          if (!response.ok) {
            return {
              ok: false,
              message: payload.error ?? 'Failed to create change order.',
              retryable: response.status >= 500,
            };
          }
          return { ok: true, data: payload.data };
        }
        case 'addComment': {
          const response = await fetch(`/api/cards/${mutation.cardId}/comments`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ body: mutation.body }),
          });
          const payload = await response.json();
          if (!response.ok) {
            return {
              ok: false,
              message: payload.error ?? 'Failed to add comment.',
              retryable: response.status >= 500,
            };
          }
          return { ok: true, data: payload.data };
        }
        case 'deleteCard': {
          const response = await fetch(`/api/cards/${mutation.cardId}`, {
            method: 'DELETE',
            headers,
          });
          const payload = await response.json();
          if (!response.ok) {
            return {
              ok: false,
              message: payload.error ?? 'Failed to delete job.',
              retryable: response.status >= 500,
            };
          }
          return { ok: true, data: payload.data };
        }
        default:
          return { ok: false, message: 'Unknown mutation kind.' };
      }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Network error.',
        retryable: true,
      };
    }
  };
}

export function useOutboundSync(handlers: {
  restoreBoard: (cards: BoardCardView[]) => void;
  reconcileBoardCard: (cardId: string, card: BoardCardView) => void;
  reconcileDetail: (detail: CardDetailView) => void;
  replaceTempCard: (tempId: string, card: BoardCardView) => void;
  reapplyFailedMutation?: (mutation: OutboundMutation) => void;
  onSyncSuccess: () => void;
  onSyncFailure: (message: string) => void;
}): OutboundSyncApi {
  const [queuedCount, setQueuedCount] = useState(0);
  const [inFlightCount, setInFlightCount] = useState(0);
  const sidecarsRef = useRef(new Map<string, EnqueueSidecar>());
  const failureListenersRef = useRef(new Set<(event: SyncFailureEvent) => void>());
  const queueRef = useRef<OutboundSyncQueue | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const queue = new OutboundSyncQueue(createOutboundExecutor(), {
      onPendingCountChange: ({ queued, inFlight }) => {
        setQueuedCount(queued);
        setInFlightCount(inFlight);
      },
      onSuccess: (mutation, result) => {
        if (!result.ok) {
          return;
        }

        const sidecar = sidecarsRef.current.get(mutation.clientMutationId);
        sidecarsRef.current.delete(mutation.clientMutationId);

        if (mutation.kind === 'createCard' && result.realCardId && result.data) {
          handlersRef.current.replaceTempCard(mutation.clientId, result.data as BoardCardView);
        } else if (
          (mutation.kind === 'moveCard' || mutation.kind === 'reorderCard') &&
          result.data
        ) {
          handlersRef.current.reconcileBoardCard(mutation.cardId, result.data as BoardCardView);
        } else if (mutation.kind === 'patchCard' && result.data) {
          handlersRef.current.reconcileBoardCard(mutation.cardId, result.data as BoardCardView);
        } else if (
          (mutation.kind === 'patchDetail' ||
            mutation.kind === 'saveCustomer' ||
            mutation.kind === 'addComment') &&
          result.data
        ) {
          handlersRef.current.reconcileDetail(result.data as CardDetailView);
        }

        sidecar?.onSuccess?.(result.data);
        handlersRef.current.onSyncSuccess();
      },
      onFailure: (mutation, result) => {
        const sidecar = sidecarsRef.current.get(mutation.clientMutationId);
        sidecarsRef.current.delete(mutation.clientMutationId);

        if ('cards' in mutation.rollback) {
          handlersRef.current.restoreBoard(mutation.rollback.cards as BoardCardView[]);
        }

        const event: SyncFailureEvent = {
          mutation,
          code: result.ok ? undefined : result.code,
          message: result.ok ? 'Sync failed.' : result.message,
        };

        sidecar?.onFailure?.(event);
        for (const listener of failureListenersRef.current) {
          listener(event);
        }

        if (mutation.kind === 'patchDetail' || mutation.kind === 'saveCustomer') {
          const rollback = mutation.rollback as { payload: unknown };
          if (rollback.payload && typeof rollback.payload === 'object') {
            const payload = rollback.payload as { card?: CardDetailView };
            if (payload.card) {
              handlersRef.current.reconcileDetail(payload.card);
            }
          }
        }

        handlersRef.current.onSyncFailure(event.message);
      },
    });

    queueRef.current = queue;
    return () => {
      queueRef.current = null;
    };
  }, []);

  const enqueue = useCallback((mutation: OutboundMutation, sidecar?: EnqueueSidecar) => {
    if (sidecar) {
      sidecarsRef.current.set(mutation.clientMutationId, sidecar);
    }
    queueRef.current?.enqueue(mutation);
  }, []);

  const flush = useCallback((cardId?: string) => {
    queueRef.current?.flush(cardId);
  }, []);

  const retryFailed = useCallback(() => {
    const queue = queueRef.current;
    if (!queue?.peekLastFailure()) {
      return false;
    }

    const failed = queue.peekLastFailure();
    if (failed) {
      handlersRef.current.reapplyFailedMutation?.(failed);
    }

    return queue.retryFailed();
  }, []);

  const hasWork = useCallback(() => queueRef.current?.hasWork() ?? false, []);

  const subscribeFailures = useCallback((listener: (event: SyncFailureEvent) => void) => {
    failureListenersRef.current.add(listener);
    return () => {
      failureListenersRef.current.delete(listener);
    };
  }, []);

  return {
    enqueue,
    flush,
    retryFailed,
    queuedCount,
    inFlightCount,
    hasWork,
    subscribeFailures,
  };
}

export { createClientMutationId };
