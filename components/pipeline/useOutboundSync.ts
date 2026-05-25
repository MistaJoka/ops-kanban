'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import type { CardDetailView } from '@/lib/domain/cards/cardDetail';
import { boardCardFromDetail } from '@/lib/domain/board/boardOptimistic';
import { apiFetch } from '@/lib/client/apiFetch';
import { captureSyncFailure } from '@/lib/ops/captureError';
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
  hasPendingForCard: (cardId: string) => boolean;
  subscribeFailures: (listener: (event: SyncFailureEvent) => void) => () => void;
};

export function isOutboundQueueEnabled(): boolean {
  return process.env.NEXT_PUBLIC_OUTBOUND_QUEUE !== '0';
}

function mapSyncResult<T>(
  result: Awaited<ReturnType<typeof apiFetch<T>>>,
  fallbackError: string,
): OutboundExecutorResult & { data?: T } {
  if (result.ok) {
    return { ok: true, data: result.data };
  }

  return {
    ok: false,
    message:
      result.code === 'UNAUTHORIZED'
        ? 'Session expired. Please sign in again.'
        : result.error || fallbackError,
    code: result.code,
    retryable: result.status >= 500 || result.status === 0,
  };
}

export function createOutboundExecutor(isDisposed?: () => boolean): OutboundExecutor {
  return async (mutation): Promise<OutboundExecutorResult> => {
    if (isDisposed?.()) {
      return { ok: false, message: 'Sync cancelled.', retryable: false };
    }

    const headers = {
      'Content-Type': 'application/json',
      'X-Client-Mutation-Id': mutation.clientMutationId,
    };

    try {
      switch (mutation.kind) {
        case 'createCard': {
          const result = mapSyncResult(
            await apiFetch<BoardCardView>('/api/cards', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                title: mutation.body.title,
                columnId: mutation.body.columnId,
                ...(mutation.body.jobType ? { jobType: mutation.body.jobType } : {}),
              }),
            }),
            'Failed to create card.',
          );
          if (!result.ok) return result;

          let createdCard = result.data as BoardCardView;

          if (mutation.body.customerName?.trim()) {
            const customerResult = mapSyncResult(
              await apiFetch<CardDetailView>(`/api/cards/${createdCard.id}/customer`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                  name: mutation.body.customerName.trim(),
                  address: mutation.body.customerAddress?.trim() || null,
                }),
              }),
              'Failed to save customer.',
            );
            if (customerResult.ok && customerResult.data) {
              createdCard = boardCardFromDetail(customerResult.data, createdCard);
            }
          }

          return { ok: true, data: createdCard, realCardId: createdCard.id };
        }
        case 'moveCard': {
          return mapSyncResult(
            await apiFetch<BoardCardView>(`/api/cards/${mutation.cardId}/move`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                targetColumnId: mutation.targetColumnId,
                reason: mutation.reason,
              }),
            }),
            'Failed to move card.',
          );
        }
        case 'reorderCard': {
          return mapSyncResult(
            await apiFetch<BoardCardView>(`/api/cards/${mutation.cardId}/reorder`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                ...(mutation.crossColumn ? { targetColumnId: mutation.targetColumnId } : {}),
                insertIndex: mutation.insertIndex,
                reason: mutation.reason,
              }),
            }),
            'Failed to reorder card.',
          );
        }
        case 'patchCard':
        case 'patchDetail': {
          const result = mapSyncResult(
            await apiFetch<CardDetailView>(`/api/cards/${mutation.cardId}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify(mutation.patch),
            }),
            'Failed to save.',
          );
          return result;
        }
        case 'saveCustomer': {
          return mapSyncResult(
            await apiFetch(`/api/cards/${mutation.cardId}/customer`, {
              method: 'PUT',
              headers,
              body: JSON.stringify(mutation.body),
            }),
            'Failed to save customer.',
          );
        }
        case 'saveQuote': {
          return mapSyncResult(
            await apiFetch(`/api/cards/${mutation.cardId}/quotes`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ lineItems: mutation.lineItems }),
            }),
            'Failed to save estimate.',
          );
        }
        case 'markQuoteSent': {
          return mapSyncResult(
            await apiFetch(`/api/cards/${mutation.cardId}/quotes`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ status: 'sent' }),
            }),
            'Failed to mark estimate sent.',
          );
        }
        case 'sendEstimate': {
          return mapSyncResult(
            await apiFetch(`/api/cards/${mutation.cardId}/quotes/send`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ email: mutation.email }),
            }),
            'Failed to send estimate.',
          );
        }
        case 'createInvoice': {
          return mapSyncResult(
            await apiFetch(`/api/cards/${mutation.cardId}/invoices`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ fromQuoteId: mutation.fromQuoteId }),
            }),
            'Failed to create invoice.',
          );
        }
        case 'markPaid': {
          return mapSyncResult(
            await apiFetch(`/api/invoices/${mutation.invoiceId}/mark-paid`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ method: 'manual' }),
            }),
            'Failed to mark paid.',
          );
        }
        case 'createPaymentLink': {
          return mapSyncResult(
            await apiFetch(`/api/invoices/${mutation.invoiceId}/payment-link`, {
              method: 'POST',
              headers,
            }),
            'Failed to create payment link.',
          );
        }
        case 'createChangeOrder': {
          return mapSyncResult(
            await apiFetch(`/api/cards/${mutation.cardId}/change-orders`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ title: mutation.title }),
            }),
            'Failed to create change order.',
          );
        }
        case 'addComment': {
          return mapSyncResult(
            await apiFetch(`/api/cards/${mutation.cardId}/comments`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ body: mutation.body }),
            }),
            'Failed to add comment.',
          );
        }
        case 'deleteCard': {
          return mapSyncResult(
            await apiFetch(`/api/cards/${mutation.cardId}`, {
              method: 'DELETE',
              headers,
            }),
            'Failed to delete job.',
          );
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
  onDrain?: () => void;
}): OutboundSyncApi {
  const [queuedCount, setQueuedCount] = useState(0);
  const [inFlightCount, setInFlightCount] = useState(0);
  const sidecarsRef = useRef(new Map<string, EnqueueSidecar>());
  const failureListenersRef = useRef(new Set<(event: SyncFailureEvent) => void>());
  const queueRef = useRef<OutboundSyncQueue | null>(null);
  const disposedRef = useRef(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    disposedRef.current = false;
    const queue = new OutboundSyncQueue(createOutboundExecutor(() => disposedRef.current), {
      onPendingCountChange: ({ queued, inFlight }) => {
        if (disposedRef.current) return;
        setQueuedCount(queued);
        setInFlightCount(inFlight);
      },
      onDrain: () => {
        if (disposedRef.current) return;
        handlersRef.current.onDrain?.();
      },
      onSuccess: (mutation, result) => {
        if (disposedRef.current || !result.ok) {
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
        if (disposedRef.current) return;

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
        if (!result.ok) {
          captureSyncFailure(event.message, { surface: `outbound-sync:${mutation.kind}` });
        }
      },
    });

    queueRef.current = queue;
    return () => {
      disposedRef.current = true;
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

  const hasPendingForCard = useCallback(
    (cardId: string) => queueRef.current?.hasPendingForCard(cardId) ?? false,
    [],
  );

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
    hasPendingForCard,
    subscribeFailures,
  };
}

export { createClientMutationId };
