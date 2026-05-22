import { describe, expect, it } from 'vitest';

import {
  canArchiveCard,
  canCreateCard,
  canDeleteCard,
  canManageMoney,
  canMoveCard,
} from '@/lib/domain/auth/roles';

describe('SEC-ROLE role helpers', () => {
  it('viewer is read-only for card mutations', () => {
    expect(canCreateCard('viewer')).toBe(false);
    expect(canMoveCard('viewer')).toBe(false);
    expect(canManageMoney('viewer')).toBe(false);
    expect(canArchiveCard('viewer')).toBe(false);
    expect(canDeleteCard('viewer')).toBe(false);
  });

  it('worker can create and move cards but not manage money', () => {
    expect(canCreateCard('worker')).toBe(true);
    expect(canMoveCard('worker')).toBe(true);
    expect(canManageMoney('worker')).toBe(false);
    expect(canArchiveCard('worker')).toBe(false);
  });

  it('owner and manager have admin card and money permissions', () => {
    for (const role of ['owner', 'manager'] as const) {
      expect(canManageMoney(role)).toBe(true);
      expect(canArchiveCard(role)).toBe(true);
      expect(canDeleteCard(role)).toBe(true);
    }
  });
});
