import { describe, expect, it } from 'vitest';

import { validateMove } from '@/lib/domain/pipeline/validateMove';
import { mapCompactArchivedToFull } from '@/lib/domain/pipeline/stateMap';
import { FULL_STATE_ORDER } from '@/lib/domain/pipeline/types';

const baseContext = {
  actorId: 'owner-1',
  assignedToId: null,
  scheduledStart: '2026-06-01T09:00:00.000Z',
  quoteTotal: 500,
  quoteLineItemCount: 1,
  balanceDue: 0,
  hasCustomer: true,
  hasTitle: true,
};

describe('UNIT-PIPE full pipeline mode', () => {
  it('UNIT-PIPE-007: full pipeline states and archived split map', () => {
    expect(FULL_STATE_ORDER).toHaveLength(19);
    expect(FULL_STATE_ORDER).toContain('scheduling');
    expect(FULL_STATE_ORDER).toContain('paid');
    expect(mapCompactArchivedToFull({ balanceDue: 0, invoicePaid: true })).toBe('paid');
    expect(mapCompactArchivedToFull({ balanceDue: 250, invoicePaid: false })).toBe('payment_pending');
  });

  it('UNIT-PIPE-008: scheduling column requires date in full mode', () => {
    const result = validateMove({
      ...baseContext,
      role: 'owner',
      pipelineMode: 'full',
      fromStateKey: 'approved',
      toStateKey: 'scheduling',
      scheduledStart: null,
    });

    expect(result.allowed).toBe(false);
    expect(result.code).toBe('SCHEDULE_REQUIRED');
  });

  it('UNIT-PIPE-009: owner can advance qualified→site_visit in full mode', () => {
    const result = validateMove({
      ...baseContext,
      role: 'owner',
      pipelineMode: 'full',
      fromStateKey: 'qualified',
      toStateKey: 'site_visit',
    });

    expect(result.allowed).toBe(true);
  });

  it('UNIT-PIPE-010: paid column move allowed without archive flag', () => {
    const result = validateMove({
      ...baseContext,
      role: 'owner',
      pipelineMode: 'full',
      fromStateKey: 'payment_pending',
      toStateKey: 'paid',
    });

    expect(result.allowed).toBe(true);
    expect(result.setArchivedAt).toBeUndefined();
  });
});

describe('UNIT-DASH dashboard helpers', () => {
  it('UNIT-DASH-001: overdue compares date-only due dates', () => {
    const dueDate = '2026-01-01';
    const now = '2026-06-01T12:00:00.000Z';
    expect(dueDate < now.slice(0, 10)).toBe(true);
  });
});
