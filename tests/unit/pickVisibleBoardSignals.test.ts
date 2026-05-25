import { describe, expect, it } from 'vitest';

import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import {
  hasDueSignalInMeta,
  pickVisibleBoardSignals,
} from '@/lib/domain/cards/pickVisibleBoardSignals';

function baseCard(overrides: Partial<BoardCardView> = {}): BoardCardView {
  return {
    id: 'c1',
    title: 'Test job',
    columnId: 'col1',
    stateKey: 'inquiry',
    columnCategory: 'sales',
    priority: 'medium',
    jobType: 'maintenance',
    customerName: null,
    customerAddress: null,
    position: 0,
    dueDate: null,
    scheduledStart: null,
    nextAction: null,
    daysInColumn: 1,
    isOverdue: false,
    moneyBadge: 'none',
    assignedTo: null,
    assigneeName: null,
    assigneeInitials: null,
    quoteTotal: 0,
    balanceDue: 0,
    columnEnteredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('pickVisibleBoardSignals', () => {
  it('prioritizes money before job type in sales columns', () => {
    const card = baseCard({
      columnCategory: 'sales',
      moneyBadge: 'estimate_draft',
      quoteTotal: 500,
      jobType: 'maintenance',
    });

    const { visible, overflow } = pickVisibleBoardSignals(card);
    expect(visible).toEqual(['money', 'jobType']);
    expect(overflow).toBe(0);
  });

  it('prioritizes schedule in production columns', () => {
    const card = baseCard({
      columnCategory: 'production',
      stateKey: 'scheduled',
      scheduledStart: new Date().toISOString(),
      moneyBadge: 'estimate_sent',
      quoteTotal: 1200,
      jobType: 'install',
    });

    const { visible } = pickVisibleBoardSignals(card);
    expect(visible[0]).toBe('schedule');
    expect(visible[1]).toBe('jobType');
  });

  it('reports overflow when more signals than slot budget', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const card = baseCard({
      columnCategory: 'sales',
      moneyBadge: 'estimate_draft',
      quoteTotal: 800,
      jobType: 'hardscape',
      scheduledStart: tomorrow.toISOString(),
      daysInColumn: 5,
    });

    const { visible, overflow } = pickVisibleBoardSignals(card);
    expect(visible).toHaveLength(2);
    expect(overflow).toBeGreaterThan(0);
  });

  it('hasDueSignalInMeta when due is visible', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const card = baseCard({
      dueDate: yesterday.toISOString(),
      isOverdue: true,
      moneyBadge: 'none',
    });

    expect(hasDueSignalInMeta(card)).toBe(true);
  });
});
