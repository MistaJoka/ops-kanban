export type MoneyBadge =
  | 'none'
  | 'estimate_draft'
  | 'estimate_sent'
  | 'invoice_draft'
  | 'balance_due'
  | 'paid';

export function computeMoneyBadge(
  quotes: Array<{ status: string; total: number }> | null | undefined,
  invoices: Array<{ status: string; balance_due: number }> | null | undefined,
): MoneyBadge {
  const invoice = invoices?.[0];
  if (invoice) {
    if (invoice.status === 'paid' || invoice.balance_due <= 0) {
      return 'paid';
    }

    if (invoice.balance_due > 0) {
      return 'balance_due';
    }

    return 'invoice_draft';
  }

  const quote = quotes?.[0];
  if (!quote) {
    return 'none';
  }

  if (quote.status === 'sent') {
    return 'estimate_sent';
  }

  if (quote.total > 0) {
    return 'estimate_draft';
  }

  return 'none';
}
