import { describe, expect, it } from 'vitest';

import { mapDomainError, mapSupabaseError } from '@/lib/domain/db/mapSupabaseError';
import { DomainError } from '@/lib/domain/errors';

describe('mapSupabaseError', () => {
  it('UNIT-ERR-001: maps PGRST116 to NOT_FOUND', () => {
    const mapped = mapSupabaseError(new Error('PGRST116: JSON object requested, multiple (or no) rows returned'));
    expect(mapped).toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  it('UNIT-ERR-002: maps RLS denial to FORBIDDEN', () => {
    const mapped = mapSupabaseError(new Error('42501: permission denied for table cards'));
    expect(mapped).toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  it('UNIT-ERR-003: maps connection errors to SERVICE_UNAVAILABLE', () => {
    const mapped = mapSupabaseError(new Error('fetch failed: ECONNREFUSED'));
    expect(mapped).toMatchObject({ status: 503, code: 'SERVICE_UNAVAILABLE' });
  });

  it('UNIT-ERR-005: maps DomainError FORBIDDEN', () => {
    const mapped = mapDomainError(new DomainError('Not allowed.', 'FORBIDDEN'));
    expect(mapped).toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });
});
