import { describe, expect, it } from 'vitest';

import { nextGroupKey, pickActiveGroup } from '@/lib/domain/pipeline/pickActiveGroup';

describe('pickActiveGroup', () => {
  it('returns null when no visible groups', () => {
    expect(pickActiveGroup([])).toBeNull();
    expect(
      pickActiveGroup([
        { key: 'sales', ratio: 0 },
        { key: 'production', ratio: 0 },
      ]),
    ).toBeNull();
  });

  it('picks the group with the highest intersection ratio', () => {
    expect(
      pickActiveGroup([
        { key: 'sales', ratio: 0.2 },
        { key: 'production', ratio: 0.6 },
        { key: 'billing', ratio: 0.1 },
      ]),
    ).toBe('production');
  });

  it('breaks ties by pipeline group order', () => {
    expect(
      pickActiveGroup([
        { key: 'billing', ratio: 0.5 },
        { key: 'sales', ratio: 0.5 },
      ]),
    ).toBe('sales');
  });
});

describe('nextGroupKey', () => {
  it('moves forward and backward within bounds', () => {
    expect(nextGroupKey('sales', 1)).toBe('production');
    expect(nextGroupKey('production', -1)).toBe('sales');
    expect(nextGroupKey('sales', -1)).toBe('sales');
    expect(nextGroupKey('aftercare', 1)).toBe('aftercare');
  });
});
