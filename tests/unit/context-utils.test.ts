import { describe, expect, it } from 'vitest';

import { BOARD_CARD_CAP, capVisibleCards, computeBoardMetrics } from '@/lib/ai/context-utils';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';

function makeCard(index: number): BoardCardView {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    title: `Job ${index}`,
    columnId: '00000000-0000-4000-8000-000000000099',
    stateKey: 'inquiry',
    columnCategory: 'sales',
    customerName: null,
    customerAddress: null,
    jobType: null,
    priority: 'medium',
    position: index,
    dueDate: null,
    scheduledStart: null,
    nextAction: null,
    isOverdue: index % 7 === 0,
    daysInColumn: index,
    moneyBadge: 'none',
    assignedTo: null,
    assigneeName: null,
    assigneeInitials: null,
    quoteTotal: 0,
    balanceDue: 0,
    columnEnteredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('UNIT-CTX context utils', () => {
  it('UNIT-CTX-001: board caps cards at 40', () => {
    const cards = Array.from({ length: 100 }, (_, index) => makeCard(index + 1));
    const visible = capVisibleCards(cards);
    expect(visible).toHaveLength(BOARD_CARD_CAP);
    expect(visible[0]?.title).toBe('Job 1');
    expect(visible[39]?.title).toBe('Job 40');
  });

  it('UNIT-CTX-002: metrics count overdue cards', () => {
    const cards = [makeCard(7), makeCard(14), makeCard(21)];
    const metrics = computeBoardMetrics(cards);
    expect(metrics.overdueCount).toBe(3);
  });
});
