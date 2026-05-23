export type BoardSnapshot = {
  cards: unknown[];
};

export type DetailSnapshot = {
  payload: unknown;
};

export type MoneySnapshot = {
  payload: unknown;
  boardCards: unknown[];
};

export type QuoteLine = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type CreateCardBody = {
  title: string;
  columnId: string;
  jobType?: string;
  customerName?: string;
  customerAddress?: string;
};

export type CustomerBody = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};

export type OutboundMutation =
  | {
      kind: 'createCard';
      clientMutationId: string;
      clientId: string;
      body: CreateCardBody;
      rollback: BoardSnapshot;
    }
  | {
      kind: 'moveCard';
      clientMutationId: string;
      cardId: string;
      targetColumnId: string;
      reason?: string;
      rollback: BoardSnapshot;
    }
  | {
      kind: 'reorderCard';
      clientMutationId: string;
      cardId: string;
      targetColumnId: string;
      insertIndex: number;
      crossColumn: boolean;
      reason?: string;
      rollback: BoardSnapshot;
    }
  | {
      kind: 'patchCard';
      clientMutationId: string;
      cardId: string;
      patch: Record<string, unknown>;
      rollback: BoardSnapshot;
    }
  | {
      kind: 'patchDetail';
      clientMutationId: string;
      cardId: string;
      patch: Record<string, unknown>;
      rollback: DetailSnapshot;
    }
  | {
      kind: 'saveCustomer';
      clientMutationId: string;
      cardId: string;
      body: CustomerBody;
      rollback: DetailSnapshot;
    }
  | {
      kind: 'saveQuote';
      clientMutationId: string;
      cardId: string;
      lineItems: QuoteLine[];
      rollback: MoneySnapshot;
    }
  | {
      kind: 'markQuoteSent';
      clientMutationId: string;
      cardId: string;
      rollback: MoneySnapshot;
    }
  | {
      kind: 'sendEstimate';
      clientMutationId: string;
      cardId: string;
      email: string;
      rollback: MoneySnapshot;
    }
  | {
      kind: 'createInvoice';
      clientMutationId: string;
      cardId: string;
      fromQuoteId?: string;
      rollback: MoneySnapshot;
    }
  | {
      kind: 'markPaid';
      clientMutationId: string;
      cardId: string;
      invoiceId: string;
      rollback: MoneySnapshot;
    }
  | {
      kind: 'createPaymentLink';
      clientMutationId: string;
      cardId: string;
      invoiceId: string;
      rollback: MoneySnapshot;
    }
  | {
      kind: 'createChangeOrder';
      clientMutationId: string;
      cardId: string;
      title: string;
      rollback: MoneySnapshot;
    }
  | {
      kind: 'addComment';
      clientMutationId: string;
      cardId: string;
      body: string;
      tempCommentId: string;
      rollback: DetailSnapshot;
    }
  | {
      kind: 'deleteCard';
      clientMutationId: string;
      cardId: string;
      rollback: BoardSnapshot;
    };

export type OutboundExecutorResult =
  | { ok: true; data?: unknown; realCardId?: string }
  | { ok: false; code?: string; message: string; retryable?: boolean };

export type OutboundExecutor = (mutation: OutboundMutation) => Promise<OutboundExecutorResult>;

export type OutboundQueueEvents = {
  onEnqueue?: () => void;
  onStart?: (mutation: OutboundMutation) => void;
  onSuccess?: (mutation: OutboundMutation, result: OutboundExecutorResult) => void;
  onFailure?: (mutation: OutboundMutation, result: OutboundExecutorResult) => void;
  onDrain?: () => void;
  onPendingCountChange?: (counts: { queued: number; inFlight: number }) => void;
};

const PATCH_KINDS = new Set<OutboundMutation['kind']>(['patchCard', 'patchDetail']);
const MAX_CROSS_CARD_CONCURRENCY = 3;
const PATCH_DEBOUNCE_MS = 300;
const RETRY_BACKOFF_MS = 500;

function mutationCardId(mutation: OutboundMutation): string {
  if (mutation.kind === 'createCard') {
    return mutation.clientId;
  }
  return mutation.cardId;
}

function isPatchMutation(mutation: OutboundMutation): mutation is Extract<
  OutboundMutation,
  { kind: 'patchCard' | 'patchDetail' }
> {
  return PATCH_KINDS.has(mutation.kind);
}

function mergePatchMutations(
  left: Extract<OutboundMutation, { kind: 'patchCard' | 'patchDetail' }>,
  right: Extract<OutboundMutation, { kind: 'patchCard' | 'patchDetail' }>,
): Extract<OutboundMutation, { kind: 'patchCard' | 'patchDetail' }> {
  if (left.kind !== right.kind) {
    return right;
  }

  if (left.kind === 'patchCard') {
    return {
      ...right,
      kind: 'patchCard',
      patch: { ...left.patch, ...right.patch },
      rollback: left.rollback,
      clientMutationId: right.clientMutationId,
    };
  }

  return {
    ...right,
    kind: 'patchDetail',
    patch: { ...left.patch, ...right.patch },
    rollback: left.rollback,
    clientMutationId: right.clientMutationId,
  };
}

export function coalescePendingPatches(jobs: OutboundMutation[]): OutboundMutation[] {
  const result: OutboundMutation[] = [];

  for (const job of jobs) {
    const previous = result[result.length - 1];
    if (
      previous &&
      isPatchMutation(previous) &&
      isPatchMutation(job) &&
      previous.kind === job.kind &&
      mutationCardId(previous) === mutationCardId(job)
    ) {
      result[result.length - 1] = mergePatchMutations(previous, job);
    } else {
      result.push(job);
    }
  }

  return result;
}

export function rewriteMutationCardId(
  mutation: OutboundMutation,
  fromId: string,
  toId: string,
): OutboundMutation {
  if (mutation.kind === 'createCard') {
    return mutation;
  }

  if (mutation.cardId !== fromId) {
    return mutation;
  }

  return { ...mutation, cardId: toId };
}

export class OutboundSyncQueue {
  private pending: OutboundMutation[] = [];
  private inFlightByCard = new Map<string, OutboundMutation>();
  private inFlightCount = 0;
  private processing = false;
  private lastFailure: OutboundMutation | null = null;
  private patchTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private patchBuffers = new Map<string, OutboundMutation>();
  private idMap = new Map<string, string>();

  constructor(
    private executor: OutboundExecutor,
    private events: OutboundQueueEvents = {},
  ) {}

  resolveCardId(id: string): string {
    return this.idMap.get(id) ?? id;
  }

  mapClientIdToReal(clientId: string, realId: string): void {
    this.idMap.set(clientId, realId);
    this.pending = this.pending.map((job) =>
      rewriteMutationCardId(job, clientId, realId),
    );
    const buffered = this.patchBuffers.get(clientId);
    if (buffered) {
      this.patchBuffers.delete(clientId);
      const rewritten = rewriteMutationCardId(buffered, clientId, realId);
      this.patchBuffers.set(realId, rewritten);
      const timer = this.patchTimers.get(clientId);
      if (timer) {
        clearTimeout(timer);
        this.patchTimers.delete(clientId);
      }
    }
  }

  enqueue(mutation: OutboundMutation): void {
    if (isPatchMutation(mutation)) {
      this.enqueuePatchDebounced(mutation);
      return;
    }

    this.pending.push(mutation);
    this.pending = coalescePendingPatches(this.pending);
    this.events.onEnqueue?.();
    this.emitCounts();
    void this.process();
  }

  flush(cardId?: string): void {
    if (cardId) {
      this.flushPatchBuffer(cardId);
      this.flushPatchBuffer(this.resolveCardId(cardId));
      return;
    }

    for (const key of [...this.patchTimers.keys()]) {
      this.flushPatchBuffer(key);
    }
  }

  retryFailed(): boolean {
    if (!this.lastFailure) {
      return false;
    }

    const mutation = this.lastFailure;
    this.lastFailure = null;
    this.enqueue(mutation);
    return true;
  }

  peekLastFailure(): OutboundMutation | null {
    return this.lastFailure;
  }

  getQueuedCount(): number {
    return this.pending.length + this.patchBuffers.size;
  }

  getInFlightCount(): number {
    return this.inFlightCount;
  }

  hasWork(): boolean {
    return this.getQueuedCount() > 0 || this.inFlightCount > 0;
  }

  private enqueuePatchDebounced(mutation: OutboundMutation & { kind: 'patchCard' | 'patchDetail' }) {
    const cardId = mutationCardId(mutation);
    const existing = this.patchBuffers.get(cardId);
    const merged =
      existing && isPatchMutation(existing) && existing.kind === mutation.kind ?
        mergePatchMutations(existing, mutation)
      : mutation;

    this.patchBuffers.set(cardId, merged);

    const existingTimer = this.patchTimers.get(cardId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    this.patchTimers.set(
      cardId,
      setTimeout(() => {
        this.flushPatchBuffer(cardId);
      }, PATCH_DEBOUNCE_MS),
    );

    this.events.onEnqueue?.();
    this.emitCounts();
  }

  private flushPatchBuffer(cardId: string): void {
    const timer = this.patchTimers.get(cardId);
    if (timer) {
      clearTimeout(timer);
      this.patchTimers.delete(cardId);
    }

    const buffered = this.patchBuffers.get(cardId);
    if (!buffered) {
      return;
    }

    this.patchBuffers.delete(cardId);
    this.pending.push(buffered);
    this.pending = coalescePendingPatches(this.pending);
    void this.process();
    this.emitCounts();
  }

  private emitCounts(): void {
    this.events.onPendingCountChange?.({
      queued: this.getQueuedCount(),
      inFlight: this.inFlightCount,
    });
  }

  private async process(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      while (this.pending.length > 0 && this.inFlightCount < MAX_CROSS_CARD_CONCURRENCY) {
        const nextIndex = this.pending.findIndex((job) => {
          const cardKey = mutationCardId(job);
          return !this.inFlightByCard.has(cardKey);
        });

        if (nextIndex === -1) {
          break;
        }

        const [job] = this.pending.splice(nextIndex, 1);
        void this.runJob(job);
      }
    } finally {
      this.processing = false;
    }

    if (!this.hasWork()) {
      this.events.onDrain?.();
    }
  }

  private async runJob(job: OutboundMutation, attempt = 0): Promise<void> {
    const cardKey = mutationCardId(job);
    if (attempt === 0) {
      this.inFlightByCard.set(cardKey, job);
      this.inFlightCount += 1;
      this.emitCounts();
    }
    this.events.onStart?.(job);

    let retrying = false;

    try {
      const result = await this.executor(job);

      if (!result.ok && result.retryable && attempt === 0) {
        retrying = true;
        await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS));
        await this.runJob(job, attempt + 1);
        return;
      }

      if (!result.ok) {
        this.lastFailure = job;
        this.events.onFailure?.(job, result);
      } else {
        if (job.kind === 'createCard' && result.realCardId) {
          this.mapClientIdToReal(job.clientId, result.realCardId);
        }
        this.events.onSuccess?.(job, result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed.';
      if (attempt === 0) {
        retrying = true;
        await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS));
        await this.runJob(job, attempt + 1);
        return;
      }

      this.lastFailure = job;
      this.events.onFailure?.(job, { ok: false, message, retryable: false });
    } finally {
      if (!retrying) {
        this.inFlightByCard.delete(cardKey);
        this.inFlightCount = Math.max(0, this.inFlightCount - 1);
        this.emitCounts();
        void this.process();

        if (!this.hasWork()) {
          this.events.onDrain?.();
        }
      }
    }
  }
}

export function createClientMutationId(): string {
  return crypto.randomUUID();
}
