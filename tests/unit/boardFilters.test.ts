import { describe, expect, it } from 'vitest';

import {
  filterBoardCards,
  isScheduledThisWeek,
  matchesAdvancedFilter,
  matchesBoardSearch,
} from '@/lib/domain/board/boardFilters';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';

const USER_ID = 'user-abc';

function sampleCard(overrides: Partial<BoardCardView> = {}): BoardCardView {
  return {
    id: 'card-1',
    title: 'Spring cleanup',
    columnId: 'col-1',
    stateKey: 'inquiry',
    columnCategory: 'sales',
    priority: 'medium',
    jobType: 'cleanup',
    customerName: 'Oak Ridge HOA',
    customerAddress: '12 Oak St',
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
    columnEnteredAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('boardFilters', () => {
  describe('matchesAdvancedFilter', () => {
    it('excludes archived cards for the all filter', () => {
      expect(matchesAdvancedFilter(sampleCard(), 'all', USER_ID)).toBe(true);
      expect(matchesAdvancedFilter(sampleCard({ stateKey: 'archived' }), 'all', USER_ID)).toBe(
        false,
      );
    });

    it('matches archived, overdue, and scheduled filters', () => {
      expect(matchesAdvancedFilter(sampleCard({ stateKey: 'archived' }), 'archived', USER_ID)).toBe(
        true,
      );
      expect(matchesAdvancedFilter(sampleCard({ isOverdue: true }), 'overdue', USER_ID)).toBe(true);
      expect(
        matchesAdvancedFilter(
          sampleCard({ scheduledStart: '2026-05-10T09:00:00.000Z' }),
          'scheduled',
          USER_ID,
        ),
      ).toBe(true);
    });

    it('matches assignment filters', () => {
      expect(
        matchesAdvancedFilter(sampleCard({ assignedTo: USER_ID }), 'assigned_to_me', USER_ID),
      ).toBe(true);
      expect(
        matchesAdvancedFilter(sampleCard({ assignedTo: 'other-user' }), 'assigned_to_me', USER_ID),
      ).toBe(false);
      expect(matchesAdvancedFilter(sampleCard(), 'unassigned', USER_ID)).toBe(true);
      expect(
        matchesAdvancedFilter(sampleCard({ assignedTo: USER_ID }), 'unassigned', USER_ID),
      ).toBe(false);
    });

    it('matches balance due by badge or amount', () => {
      expect(
        matchesAdvancedFilter(sampleCard({ moneyBadge: 'balance_due' }), 'balance_due', USER_ID),
      ).toBe(true);
      expect(
        matchesAdvancedFilter(
          sampleCard({ moneyBadge: 'invoice_draft', balanceDue: 250 }),
          'balance_due',
          USER_ID,
        ),
      ).toBe(true);
      expect(matchesAdvancedFilter(sampleCard(), 'balance_due', USER_ID)).toBe(false);
    });

    it('matches scheduled this week and job type filters', () => {
      const now = new Date('2026-05-20T12:00:00.000Z');
      const scheduled = '2026-05-22T09:00:00.000Z';

      expect(isScheduledThisWeek(scheduled, now)).toBe(true);
      expect(isScheduledThisWeek('2026-05-12T09:00:00.000Z', now)).toBe(false);

      const thisWeek = new Date();
      thisWeek.setHours(12, 0, 0, 0);
      expect(
        matchesAdvancedFilter(
          sampleCard({ scheduledStart: thisWeek.toISOString() }),
          'scheduled_this_week',
          USER_ID,
        ),
      ).toBe(true);

      expect(
        matchesAdvancedFilter(
          sampleCard({ jobType: 'irrigation' }),
          { key: 'job_type', jobType: 'irrigation' },
          USER_ID,
        ),
      ).toBe(true);
      expect(
        matchesAdvancedFilter(
          sampleCard({ jobType: 'cleanup' }),
          { key: 'job_type', jobType: 'irrigation' },
          USER_ID,
        ),
      ).toBe(false);
    });
  });

  describe('search composition', () => {
    it('matches search across title, customer, address, and job type', () => {
      const card = sampleCard();
      expect(matchesBoardSearch(card, 'oak ridge')).toBe(true);
      expect(matchesBoardSearch(card, 'cleanup')).toBe(true);
      expect(matchesBoardSearch(card, 'irrigation')).toBe(false);
    });

    it('composes search with advanced filters', () => {
      const cards = [
        sampleCard({ id: 'a', title: 'Oak cleanup', assignedTo: USER_ID }),
        sampleCard({ id: 'b', title: 'Oak install', jobType: 'install', assignedTo: USER_ID }),
        sampleCard({ id: 'c', title: 'Pine cleanup', assignedTo: null }),
      ];

      const filtered = filterBoardCards(cards, 'oak', 'assigned_to_me', USER_ID);
      expect(filtered.map((card) => card.id)).toEqual(['a', 'b']);
    });
  });
});
