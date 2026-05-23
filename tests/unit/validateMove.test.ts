import { describe, expect, it } from 'vitest';

import { validateMove } from '@/lib/domain/pipeline/validateMove';

const baseContext = {
  actorId: 'user-1',
  assignedToId: null as string | null,
  scheduledStart: '2026-06-01T09:00:00.000Z',
  quoteTotal: 500,
  quoteLineItemCount: 2,
  balanceDue: 0,
  hasCustomer: true,
  hasTitle: true,
};

describe('UNIT-PIPE pipeline validation', () => {
  it('UNIT-PIPE-001: valid forward move inquiry→site_visit', () => {
    const result = validateMove({
      ...baseContext,
      role: 'worker',
      fromStateKey: 'inquiry',
      toStateKey: 'site_visit',
    });

    expect(result.allowed).toBe(true);
  });

  it('UNIT-PIPE-002: owner skip inquiry→estimating', () => {
    const result = validateMove({
      ...baseContext,
      role: 'owner',
      fromStateKey: 'inquiry',
      toStateKey: 'estimating',
    });

    expect(result.allowed).toBe(true);
    expect(result.requiresReason).toBe(true);
  });

  it('UNIT-PIPE-003: worker skip inquiry→estimating denied', () => {
    const result = validateMove({
      ...baseContext,
      role: 'worker',
      fromStateKey: 'inquiry',
      toStateKey: 'estimating',
    });

    expect(result.allowed).toBe(false);
    expect(result.code).toBe('SKIP_DENIED');
  });

  it('UNIT-PIPE-004: scheduled without date blocked', () => {
    const result = validateMove({
      ...baseContext,
      role: 'owner',
      fromStateKey: 'approved',
      toStateKey: 'scheduled',
      scheduledStart: null,
    });

    expect(result.allowed).toBe(false);
    expect(result.code).toBe('SCHEDULE_REQUIRED');
  });

  it('UNIT-PIPE-005: estimate_sent with zero quote blocked', () => {
    const result = validateMove({
      ...baseContext,
      role: 'owner',
      fromStateKey: 'estimating',
      toStateKey: 'estimate_sent',
      quoteTotal: 0,
      quoteLineItemCount: 0,
    });

    expect(result.allowed).toBe(false);
    expect(result.code).toBe('ESTIMATE_REQUIRED');
  });

  it('UNIT-PIPE-005b: estimate_sent without customer blocked', () => {
    const result = validateMove({
      ...baseContext,
      role: 'owner',
      fromStateKey: 'estimating',
      toStateKey: 'estimate_sent',
      hasCustomer: false,
    });

    expect(result.allowed).toBe(false);
    expect(result.code).toBe('INVALID_STATE');
  });

  it('UNIT-PIPE-005c: worker cannot move unassigned card assigned to another user', () => {
    const result = validateMove({
      ...baseContext,
      role: 'worker',
      actorId: 'worker-2',
      assignedToId: 'worker-1',
      fromStateKey: 'inquiry',
      toStateKey: 'site_visit',
    });

    expect(result.allowed).toBe(false);
    expect(result.code).toBe('FORBIDDEN');
  });

  it('UNIT-PIPE-005d: worker cannot archive jobs', () => {
    const result = validateMove({
      ...baseContext,
      role: 'worker',
      fromStateKey: 'complete',
      toStateKey: 'archived',
    });

    expect(result.allowed).toBe(false);
    expect(result.code).toBe('FORBIDDEN');
  });

  it('UNIT-PIPE-006: archived sets archived_at flag', () => {
    const result = validateMove({
      ...baseContext,
      role: 'owner',
      fromStateKey: 'complete',
      toStateKey: 'archived',
    });

    expect(result.allowed).toBe(true);
    expect(result.setArchivedAt).toBe(true);
  });

  it('UNIT-VAL-002: archived with balance due requires reason', () => {
    const result = validateMove({
      ...baseContext,
      role: 'owner',
      fromStateKey: 'complete',
      toStateKey: 'archived',
      balanceDue: 250,
    });

    expect(result.allowed).toBe(true);
    expect(result.requiresReason).toBe(true);
    expect(result.message).toContain('250');
  });
});
