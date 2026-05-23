import { describe, expect, it, vi } from 'vitest';

import {
  coalescePendingPatches,
  createClientMutationId,
  OutboundSyncQueue,
  rewriteMutationCardId,
  type OutboundExecutor,
  type OutboundMutation,
} from '@/lib/domain/board/outboundSyncQueue';

function patchJob(
  cardId: string,
  patch: Record<string, unknown>,
  kind: 'patchCard' | 'patchDetail' = 'patchCard',
): OutboundMutation {
  if (kind === 'patchDetail') {
    return {
      kind: 'patchDetail',
      clientMutationId: createClientMutationId(),
      cardId,
      patch,
      rollback: { payload: null },
    };
  }

  return {
    kind: 'patchCard',
    clientMutationId: createClientMutationId(),
    cardId,
    patch,
    rollback: { cards: [] },
  };
}

function moveJob(cardId: string): OutboundMutation {
  return {
    kind: 'moveCard',
    clientMutationId: createClientMutationId(),
    cardId,
    targetColumnId: 'col-2',
    rollback: { cards: [] },
  };
}

describe('coalescePendingPatches', () => {
  it('UNIT-SYNC-003: merges consecutive patch payloads for the same card', () => {
    const merged = coalescePendingPatches([
      patchJob('c1', { title: 'A' }),
      patchJob('c1', { dueDate: '2026-01-01' }),
      moveJob('c1'),
      patchJob('c1', { priority: 'high' }),
    ]);

    expect(merged).toHaveLength(3);
    expect(merged[0]).toMatchObject({
      kind: 'patchCard',
      cardId: 'c1',
      patch: { title: 'A', dueDate: '2026-01-01' },
    });
    expect(merged[1]).toMatchObject({ kind: 'moveCard', cardId: 'c1' });
    expect(merged[2]).toMatchObject({
      kind: 'patchCard',
      cardId: 'c1',
      patch: { priority: 'high' },
    });
  });
});

describe('rewriteMutationCardId', () => {
  it('UNIT-SYNC-005: rewrites pending card references after create', () => {
    const rewritten = rewriteMutationCardId(
      patchJob('temp-1', { title: 'Updated' }),
      'temp-1',
      'real-1',
    );

    expect(rewritten).toMatchObject({ cardId: 'real-1' });
  });
});

describe('OutboundSyncQueue', () => {
  it('UNIT-SYNC-001: runs jobs for the same card in FIFO order', async () => {
    const order: string[] = [];
    const executor: OutboundExecutor = async (mutation) => {
      order.push(`${mutation.kind}:${mutationCardId(mutation)}`);
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { ok: true };
    };

    const queue = new OutboundSyncQueue(executor);
    queue.enqueue(moveJob('c1'));
    queue.enqueue(patchJob('c1', { title: 'Next' }));
    queue.flush('c1');

    await waitForDrain(queue);

    expect(order).toEqual(['moveCard:c1', 'patchCard:c1']);
  });

  it('UNIT-SYNC-002: allows up to three different cards in flight', async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    const executor: OutboundExecutor = async (mutation) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 20));
      inFlight -= 1;
      return { ok: true, data: mutation };
    };

    const queue = new OutboundSyncQueue(executor);
    queue.enqueue(moveJob('c1'));
    queue.enqueue(moveJob('c2'));
    queue.enqueue(moveJob('c3'));
    queue.enqueue(moveJob('c4'));

    await waitForDrain(queue);

    expect(maxInFlight).toBe(3);
  });

  it('UNIT-SYNC-004: emits failure for non-retryable errors', async () => {
    const onFailure = vi.fn();
    const queue = new OutboundSyncQueue(
      async () => ({ ok: false, message: 'blocked', code: 'VALIDATION_ERROR' }),
      { onFailure },
    );

    queue.enqueue(moveJob('c1'));
    await waitForDrain(queue);

    expect(onFailure).toHaveBeenCalledTimes(1);
  });

  it('UNIT-SYNC-006: retries once on retryable failure', async () => {
    let attempts = 0;
    const queue = new OutboundSyncQueue(async () => {
      attempts += 1;
      if (attempts === 1) {
        return { ok: false, message: 'server down', retryable: true };
      }
      return { ok: true };
    });

    queue.enqueue(moveJob('c1'));
    await waitForDrain(queue);

    expect(attempts).toBe(2);
  });

  it('UNIT-SYNC-007: calls onDrain when queue is empty', async () => {
    const onDrain = vi.fn();
    const queue = new OutboundSyncQueue(async () => ({ ok: true }), { onDrain });

    queue.enqueue(moveJob('c1'));
    await waitForDrain(queue);

    expect(onDrain).toHaveBeenCalled();
  });

  it('UNIT-SYNC-008: retryFailed re-enqueues last failure after peek', async () => {
    let attempts = 0;
    const executor = vi.fn(async () => {
      attempts += 1;
      if (attempts === 1) {
        return { ok: false as const, message: 'blocked', retryable: false };
      }
      return { ok: true as const };
    });
    const queue = new OutboundSyncQueue(executor);

    queue.enqueue(moveJob('c1'));
    await waitForDrain(queue);

    expect(executor).toHaveBeenCalledTimes(1);
    expect(queue.peekLastFailure()).toMatchObject({ kind: 'moveCard', cardId: 'c1' });
    expect(queue.retryFailed()).toBe(true);
    await waitForDrain(queue);
    expect(executor).toHaveBeenCalledTimes(2);
    expect(queue.peekLastFailure()).toBeNull();
  });

  it('debounces patch jobs before processing', async () => {
    vi.useFakeTimers();
    const executor = vi.fn(
      async (): Promise<import('@/lib/domain/board/outboundSyncQueue').OutboundExecutorResult> => ({
        ok: true as const,
      }),
    );
    const queue = new OutboundSyncQueue(executor);

    queue.enqueue(patchJob('c1', { title: 'A' }));
    queue.enqueue(patchJob('c1', { priority: 'high' }));

    expect(executor).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(300);
    await waitForDrain(queue);

    expect(executor).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

function mutationCardId(mutation: OutboundMutation): string {
  return mutation.kind === 'createCard' ? mutation.clientId : mutation.cardId;
}

async function waitForDrain(queue: OutboundSyncQueue, timeoutMs = 3000): Promise<void> {
  const started = Date.now();
  while (queue.hasWork()) {
    if (Date.now() - started > timeoutMs) {
      throw new Error('Queue did not drain in time.');
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}
