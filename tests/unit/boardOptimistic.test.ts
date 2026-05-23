import { describe, expect, it } from 'vitest';

import {
  applyBoardCardPatch,
  boardCardMovePatch,
  createOptimisticBoardCard,
  insertAtPosition,
  isTempCardId,
  nextCardPosition,
  removeBoardCardById,
  reorderBoardCards,
  replaceBoardCard,
  sortBoardCards,
  tempCardId,
} from '@/lib/domain/board/boardOptimistic';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';

const sampleCard = (overrides: Partial<BoardCardView> = {}): BoardCardView => ({
  id: 'card-1',
  title: 'Sample job',
  columnId: 'col-1',
  stateKey: 'inquiry',
  columnCategory: 'sales',
  priority: 'medium',
  jobType: null,
  customerName: null,
  customerAddress: null,
  position: 0,
  dueDate: null,
  scheduledStart: null,
  nextAction: null,
  daysInColumn: 2,
  isOverdue: false,
  moneyBadge: 'none',
  assignedTo: null,
  assigneeName: null,
  assigneeInitials: null,
  quoteTotal: 0,
  balanceDue: 0,
  columnEnteredAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('boardOptimistic', () => {
  it('creates temp ids and optimistic cards', () => {
    const id = tempCardId();
    expect(isTempCardId(id)).toBe(true);
    expect(isTempCardId('card-1')).toBe(false);

    const card = createOptimisticBoardCard({
      id,
      title: 'New inquiry',
      columnId: 'col-1',
      stateKey: 'inquiry',
      position: 3,
    });

    expect(card.title).toBe('New inquiry');
    expect(card.position).toBe(3);
    expect(card.stateKey).toBe('inquiry');
  });

  it('computes next position within a column', () => {
    const cards = [
      sampleCard({ id: 'a', columnId: 'col-1', position: 0 }),
      sampleCard({ id: 'b', columnId: 'col-1', position: 4 }),
      sampleCard({ id: 'c', columnId: 'col-2', position: 1 }),
    ];

    expect(nextCardPosition(cards, 'col-1')).toBe(5);
    expect(nextCardPosition(cards, 'col-3')).toBe(0);
  });

  it('replaces temp cards and sorts by position', () => {
    const temp = tempCardId();
    const cards = [
      sampleCard({ id: temp, position: 2 }),
      sampleCard({ id: 'real', position: 0 }),
    ];

    const withoutTemp = removeBoardCardById(cards, temp);
    const merged = replaceBoardCard(withoutTemp, 'real', sampleCard({ id: 'real', position: 9 }));
    const sorted = sortBoardCards(merged);

    expect(withoutTemp).toHaveLength(1);
    expect(sorted[0]?.position).toBe(9);
  });

  it('applies move patch with target column metadata', () => {
    const moved = boardCardMovePatch(sampleCard(), {
      id: 'col-2',
      name: 'Approved',
      stateKey: 'approved',
      position: 4,
    });

    expect(moved.columnId).toBe('col-2');
    expect(moved.stateKey).toBe('approved');
    expect(moved.columnCategory).toBe('production');
    expect(moved.daysInColumn).toBe(0);
  });

  it('recomputes overdue flag when due date changes', () => {
    const overdue = applyBoardCardPatch(sampleCard(), {
      dueDate: '2020-01-01T00:00:00.000Z',
      stateKey: 'inquiry',
    });

    expect(overdue.isOverdue).toBe(true);
  });

  it('inserts a card at a target index within a column', () => {
    const cards = [
      sampleCard({ id: 'a', columnId: 'col-1', position: 0 }),
      sampleCard({ id: 'b', columnId: 'col-1', position: 1 }),
      sampleCard({ id: 'c', columnId: 'col-2', position: 0 }),
    ];

    const inserted = insertAtPosition(cards, sampleCard({ id: 'b' }), 'col-1', 0);
    const colOne = inserted.filter((card) => card.columnId === 'col-1');

    expect(colOne.map((card) => card.id)).toEqual(['b', 'a']);
    expect(colOne[0]?.position).toBeLessThan(colOne[1]?.position ?? 0);
  });

  it('reorders cards across columns with target metadata', () => {
    const cards = [
      sampleCard({ id: 'a', columnId: 'col-1', position: 0 }),
      sampleCard({ id: 'b', columnId: 'col-1', position: 1 }),
    ];

    const reordered = reorderBoardCards(cards, 'a', 'col-2', 0, [
      { id: 'col-1', name: 'Inquiry', stateKey: 'inquiry', position: 0 },
      { id: 'col-2', name: 'Approved', stateKey: 'approved', position: 1 },
    ]);

    const moved = reordered.find((card) => card.id === 'a');
    expect(moved?.columnId).toBe('col-2');
    expect(moved?.stateKey).toBe('approved');
    expect(reordered.filter((card) => card.columnId === 'col-1')).toHaveLength(1);
  });
});
