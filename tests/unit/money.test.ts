import { describe, expect, it } from 'vitest';

import { computeBalanceDue, roundMoney } from '@/lib/domain/money/moneyMath';
import { computeQuoteTotals } from '@/lib/domain/money/quotes';

describe('UNIT-MNY money calculations', () => {
  it('UNIT-MNY-001: quote line items sum subtotal correctly', () => {
    const result = computeQuoteTotals([
      { description: 'Spring cleanup', quantity: 1, unitPrice: 350 },
      { description: 'Mulch install', quantity: 4, unitPrice: 45 },
    ]);

    expect(result.subtotal).toBe(530);
    expect(result.total).toBe(530);
    expect(result.items).toHaveLength(2);
    expect(result.items[1]?.total).toBe(180);
  });

  it('UNIT-MNY-002: tax and total use two-decimal precision', () => {
    const result = computeQuoteTotals(
      [{ description: 'Labor', quantity: 3, unitPrice: 33.33 }],
      0.0825,
    );

    expect(result.subtotal).toBe(99.99);
    expect(result.tax).toBe(8.25);
    expect(result.total).toBe(108.24);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  it('UNIT-MNY-003: invoice balance_due equals total minus payments', () => {
    expect(computeBalanceDue(500, 200)).toBe(300);
    expect(computeBalanceDue(125.5, 125.5)).toBe(0);
    expect(computeBalanceDue(100, 150)).toBe(0);
  });
});
