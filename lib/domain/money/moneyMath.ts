export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeBalanceDue(total: number, amountPaid = 0): number {
  return roundMoney(Math.max(0, total - amountPaid));
}
