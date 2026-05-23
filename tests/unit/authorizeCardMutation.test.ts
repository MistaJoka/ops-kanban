import { describe, expect, it } from 'vitest';

import {
  canCommentOnCard,
  canEditCard,
  canEditCardCustomer,
  canMoveCardOnBoard,
} from '@/lib/domain/cards/authorizeCardMutation';

describe('SEC-ROLE card authorization', () => {
  const assignedCard = { assignedTo: 'worker-1' as string | null };
  const unassignedCard = { assignedTo: null };

  it('viewer cannot edit cards', () => {
    expect(canEditCard('viewer', { title: 'New title' }, unassignedCard, 'user-1')).toBe(false);
  });

  it('worker can edit scope fields on assigned card', () => {
    expect(canEditCard('worker', { nextAction: 'Call customer' }, assignedCard, 'worker-1')).toBe(
      true,
    );
  });

  it('worker cannot edit title on assigned card', () => {
    expect(canEditCard('worker', { title: 'New title' }, assignedCard, 'worker-1')).toBe(false);
  });

  it('worker cannot edit card assigned to someone else', () => {
    expect(canEditCard('worker', { nextAction: 'Call customer' }, assignedCard, 'worker-2')).toBe(
      false,
    );
  });

  it('manager can edit any field', () => {
    expect(
      canEditCard('manager', { title: 'Updated', priority: 'urgent' }, assignedCard, 'mgr-1'),
    ).toBe(true);
  });

  it('worker can move assigned or unassigned cards only', () => {
    expect(canMoveCardOnBoard('worker', assignedCard, 'worker-1')).toBe(true);
    expect(canMoveCardOnBoard('worker', unassignedCard, 'worker-1')).toBe(true);
    expect(canMoveCardOnBoard('worker', assignedCard, 'worker-2')).toBe(false);
  });

  it('viewer cannot comment', () => {
    expect(canCommentOnCard('viewer', unassignedCard, 'user-1')).toBe(false);
  });

  it('only owner/manager can edit customer', () => {
    expect(canEditCardCustomer('owner')).toBe(true);
    expect(canEditCardCustomer('manager')).toBe(true);
    expect(canEditCardCustomer('worker')).toBe(false);
  });
});
