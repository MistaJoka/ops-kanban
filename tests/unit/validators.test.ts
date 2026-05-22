import { describe, expect, it } from 'vitest';

import { normalizePhone } from '@/lib/domain/comms/messages';
import { mapCompactArchivedToFull, mapFullTerminalToCompact } from '@/lib/domain/pipeline/stateMap';
import { validateCardTitle, validateRevenueValue } from '@/lib/domain/validation/fields';
import { validateToolProposal } from '@/lib/ai/intent-router';
import {
  ALL_ORG_SCOPED_TABLES,
  BASE_ORG_SCOPED_TABLES,
  WAVE4_ORG_SCOPED_TABLES,
} from '@/tests/helpers/orgScopedTables';

describe('UNIT-VAL field validators', () => {
  it('UNIT-VAL-001: title min length 1', () => {
    expect(validateCardTitle('')).toEqual({ ok: false, error: 'Title is required.' });
    expect(validateCardTitle('   ')).toEqual({ ok: false, error: 'Title is required.' });
    expect(validateCardTitle('Oak St cleanup')).toEqual({ ok: true });
  });

  it('UNIT-VAL-004: phone normalize strips formatting and country code', () => {
    expect(normalizePhone('(555) 123-4567')).toBe('5551234567');
    expect(normalizePhone('+1 555-123-4567')).toBe('5551234567');
    expect(normalizePhone('15551234567')).toBe('5551234567');
  });

  it('UNIT-VAL-005: revenue_value non-negative', () => {
    expect(validateRevenueValue(-1)).toEqual({
      ok: false,
      error: 'Revenue value must be non-negative.',
    });
    expect(validateRevenueValue(0)).toEqual({ ok: true });
    expect(validateRevenueValue(250.5)).toEqual({ ok: true });
  });

  it('UNIT-VAL-006: createCard schema rejects empty title', () => {
    expect(() =>
      validateToolProposal({
        toolName: 'createCard',
        input: { title: '' },
      }),
    ).toThrow();
  });
});

describe('UNIT-PIPE compact to full state map', () => {
  it('UNIT-PIPE-007: archived compact card splits by payment state', () => {
    expect(mapCompactArchivedToFull({ balanceDue: 120, invoicePaid: false })).toBe('payment_pending');
    expect(mapCompactArchivedToFull({ balanceDue: 0, invoicePaid: true })).toBe('paid');
    expect(
      mapCompactArchivedToFull({ balanceDue: 0, invoicePaid: true, needsRetentionFollowUp: true }),
    ).toBe('retention');
    expect(mapCompactArchivedToFull({ balanceDue: 0, invoicePaid: false })).toBe('archived');
  });

  it('UNIT-PIPE-011: full terminal columns collapse to compact archived', () => {
    expect(mapFullTerminalToCompact('paid')).toBe('archived');
    expect(mapFullTerminalToCompact('retention')).toBe('archived');
    expect(mapFullTerminalToCompact('archived')).toBe('archived');
    expect(mapFullTerminalToCompact('inquiry')).toBeNull();
  });
});

describe('SEC-RLS matrix registry', () => {
  it('SEC-RLS-COV-001: base tables always in matrix', () => {
    for (const table of BASE_ORG_SCOPED_TABLES) {
      expect(ALL_ORG_SCOPED_TABLES).toContain(table);
    }
  });

  it('SEC-RLS-COV-002: wave 4 tables registered for automation coverage', () => {
    for (const table of WAVE4_ORG_SCOPED_TABLES) {
      expect(ALL_ORG_SCOPED_TABLES).toContain(table);
    }
  });
});
