import type { BoardColumnView } from '@/lib/domain/board/getBoard';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import { getAssigneeInitials } from '@/lib/domain/cards/boardCardFormatters';
import { computeInsertPosition } from '@/lib/domain/cards/cardPosition';
import type { CardDetailView } from '@/lib/domain/cards/cardDetail';
import { COLUMN_CATEGORY } from '@/lib/domain/pipeline/types';

export function computeIsOverdue(dueDate: string | null, stateKey: string): boolean {
  return Boolean(dueDate && new Date(dueDate).getTime() < Date.now() && stateKey !== 'archived');
}

export function computeDaysInColumn(columnEnteredAt: string): number {
  const entered = new Date(columnEnteredAt).getTime();
  return Math.max(0, Math.floor((Date.now() - entered) / (1000 * 60 * 60 * 24)));
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
    assignedTo: null,
    assigneeName: null,
    assigneeInitials: null,
    quoteTotal: 0,
    balanceDue: 0,
    columnEnteredAt: now,
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

  if (patch.assigneeName !== undefined) {
    next.assigneeInitials = getAssigneeInitials(next.assigneeName);
  }

  if (patch.columnEnteredAt !== undefined) {
    next.daysInColumn = computeDaysInColumn(next.columnEnteredAt);
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
    daysInColumn: computeDaysInColumn(existing?.columnEnteredAt ?? detail.updatedAt),
    isOverdue: computeIsOverdue(detail.dueDate, detail.stateKey),
    moneyBadge,
    assignedTo: detail.assignedTo,
    assigneeName: detail.assigneeName,
    assigneeInitials: getAssigneeInitials(detail.assigneeName),
    quoteTotal: detail.quoteTotal,
    balanceDue: existing?.balanceDue ?? 0,
    columnEnteredAt: existing?.columnEnteredAt ?? detail.updatedAt,
    updatedAt: detail.updatedAt,
  };
}

export function boardCardMovePatch(
  card: BoardCardView,
  targetColumn: BoardColumnView,
): BoardCardView {
  const now = new Date().toISOString();

  return applyBoardCardPatch(card, {
    columnId: targetColumn.id,
    stateKey: targetColumn.stateKey,
    columnCategory:
      COLUMN_CATEGORY[targetColumn.stateKey as keyof typeof COLUMN_CATEGORY] ?? 'sales',
    daysInColumn: 0,
    columnEnteredAt: now,
    updatedAt: now,
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

export function detailStubFromBoardCard(card: BoardCardView): CardDetailView {
  const now = new Date().toISOString();

  return {
    id: card.id,
    title: card.title,
    description: null,
    columnId: card.columnId,
    stateKey: card.stateKey,
    columnCategory:
      card.columnCategory ??
      COLUMN_CATEGORY[card.stateKey as keyof typeof COLUMN_CATEGORY] ??
      'sales',
    priority: card.priority,
    jobType: card.jobType,
    nextAction: card.nextAction,
    dueDate: card.dueDate,
    scheduledStart: card.scheduledStart,
    scheduledEnd: null,
    assignedTo: card.assignedTo,
    assigneeName: card.assigneeName,
    revenueValue: 0,
    checklist: [],
    customer: card.customerName
      ? {
          id: 'stub-customer',
          name: card.customerName,
          phone: null,
          email: null,
          address: card.customerAddress,
          notes: null,
        }
      : null,
    quoteTotal: card.quoteTotal ?? 0,
    createdAt: card.columnEnteredAt ?? now,
    updatedAt: card.updatedAt ?? now,
  };
}

export function insertAtPosition(
  cards: BoardCardView[],
  card: BoardCardView,
  targetColumnId: string,
  insertIndex: number,
  targetColumn?: BoardColumnView,
): BoardCardView[] {
  const withoutCard = cards.filter((item) => item.id !== card.id);
  const columnCards = withoutCard
    .filter((item) => item.columnId === targetColumnId)
    .sort((a, b) => a.position - b.position);
  const otherCards = withoutCard.filter((item) => item.columnId !== targetColumnId);
  const clampedIndex = Math.max(0, Math.min(insertIndex, columnCards.length));
  const position = computeInsertPosition(columnCards, clampedIndex);

  let nextCard = applyBoardCardPatch(card, { position });

  if (targetColumn && card.columnId !== targetColumnId) {
    nextCard = boardCardMovePatch(nextCard, targetColumn);
  } else if (card.columnId !== targetColumnId) {
    nextCard = applyBoardCardPatch(nextCard, {
      columnId: targetColumnId,
      updatedAt: new Date().toISOString(),
    });
  }

  columnCards.splice(clampedIndex, 0, nextCard);
  return sortBoardCards([...otherCards, ...columnCards]);
}

export function reorderBoardCards(
  cards: BoardCardView[],
  cardId: string,
  targetColumnId: string,
  insertIndex: number,
  columns: BoardColumnView[],
): BoardCardView[] {
  const card = cards.find((item) => item.id === cardId);
  if (!card) {
    return cards;
  }

  const targetColumn = columns.find((column) => column.id === targetColumnId);
  return insertAtPosition(cards, card, targetColumnId, insertIndex, targetColumn);
}
