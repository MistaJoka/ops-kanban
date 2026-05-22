import type { BoardColumnView } from '@/lib/domain/board/getBoard';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import type { CardDetailView } from '@/lib/domain/cards/cardDetail';
import { COLUMN_CATEGORY } from '@/lib/domain/pipeline/types';

export function computeIsOverdue(dueDate: string | null, stateKey: string): boolean {
  return Boolean(
    dueDate && new Date(dueDate).getTime() < Date.now() && stateKey !== 'archived',
  );
}

export function computeDaysInColumn(updatedAt: string): number {
  const updated = new Date(updatedAt).getTime();
  return Math.max(0, Math.floor((Date.now() - updated) / (1000 * 60 * 60 * 24)));
}

export function tempCardId(): string {
  return `temp-${crypto.randomUUID()}`;
}

export function isTempCardId(id: string): boolean {
  return id.startsWith('temp-');
}

export function createOptimisticBoardCard(params: {
  id: string;
  title: string;
  columnId: string;
  stateKey: string;
  position: number;
}): BoardCardView {
  const now = new Date().toISOString();

  return {
    id: params.id,
    title: params.title,
    columnId: params.columnId,
    stateKey: params.stateKey,
    columnCategory: COLUMN_CATEGORY[params.stateKey as keyof typeof COLUMN_CATEGORY] ?? 'sales',
    priority: 'medium',
    jobType: null,
    customerName: null,
    customerAddress: null,
    position: params.position,
    dueDate: null,
    scheduledStart: null,
    nextAction: null,
    daysInColumn: 0,
    isOverdue: false,
    moneyBadge: 'none',
    updatedAt: now,
  };
}

export function nextCardPosition(cards: BoardCardView[], columnId: string): number {
  const inColumn = cards.filter((card) => card.columnId === columnId);
  if (inColumn.length === 0) {
    return 0;
  }

  return Math.max(...inColumn.map((card) => card.position)) + 1;
}

export function applyBoardCardPatch(
  card: BoardCardView,
  patch: Partial<BoardCardView>,
): BoardCardView {
  const next: BoardCardView = { ...card, ...patch };

  if (patch.dueDate !== undefined || patch.stateKey !== undefined) {
    next.isOverdue = computeIsOverdue(next.dueDate, next.stateKey);
  }

  if (patch.updatedAt !== undefined) {
    next.daysInColumn = computeDaysInColumn(next.updatedAt);
  }

  return next;
}

export function boardCardFromDetail(
  detail: CardDetailView,
  existing?: BoardCardView,
): BoardCardView {
  let moneyBadge = existing?.moneyBadge ?? 'none';
  if (detail.quoteTotal > 0 && moneyBadge === 'none') {
    moneyBadge = 'estimate_draft';
  }

  return {
    id: detail.id,
    title: detail.title,
    columnId: detail.columnId,
    stateKey: detail.stateKey,
    columnCategory: detail.columnCategory,
    priority: detail.priority,
    jobType: detail.jobType,
    customerName: detail.customer?.name ?? null,
    customerAddress: detail.customer?.address ?? null,
    position: existing?.position ?? 0,
    dueDate: detail.dueDate,
    scheduledStart: detail.scheduledStart,
    nextAction: detail.nextAction,
    daysInColumn: computeDaysInColumn(detail.updatedAt),
    isOverdue: computeIsOverdue(detail.dueDate, detail.stateKey),
    moneyBadge,
    updatedAt: detail.updatedAt,
  };
}

export function boardCardMovePatch(
  card: BoardCardView,
  targetColumn: BoardColumnView,
): BoardCardView {
  return applyBoardCardPatch(card, {
    columnId: targetColumn.id,
    stateKey: targetColumn.stateKey,
    columnCategory:
      COLUMN_CATEGORY[targetColumn.stateKey as keyof typeof COLUMN_CATEGORY] ?? 'sales',
    daysInColumn: 0,
    updatedAt: new Date().toISOString(),
  });
}

export function sortBoardCards(cards: BoardCardView[]): BoardCardView[] {
  return [...cards].sort((a, b) => {
    if (a.columnId !== b.columnId) {
      return 0;
    }

    return a.position - b.position;
  });
}

export function replaceBoardCard(
  cards: BoardCardView[],
  cardId: string,
  next: BoardCardView,
): BoardCardView[] {
  const index = cards.findIndex((card) => card.id === cardId);
  if (index === -1) {
    return sortBoardCards([...cards, next]);
  }

  const copy = [...cards];
  copy[index] = next;
  return sortBoardCards(copy);
}

export function removeBoardCardById(cards: BoardCardView[], cardId: string): BoardCardView[] {
  return cards.filter((card) => card.id !== cardId);
}
