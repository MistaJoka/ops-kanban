import type { SupabaseClient } from '@supabase/supabase-js';

import type { AccountingEntryType } from '@/lib/domain/accounting/recordTransaction';

export type AccountingTransactionView = {
  id: string;
  entryType: AccountingEntryType;
  amount: number;
  customerName: string | null;
  cardTitle: string | null;
  invoiceId: string | null;
  description: string;
  occurredAt: string;
};

export type ListTransactionsFilter = {
  dateFrom?: string | null;
  dateTo?: string | null;
  limit?: number;
};

export async function listAccountingTransactions(
  client: SupabaseClient,
  organizationId: string,
  filter: ListTransactionsFilter = {},
): Promise<AccountingTransactionView[]> {
  const limit = filter.limit ?? 50;

  let query = client
    .from('accounting_transactions')
    .select(
      'id, entry_type, amount, invoice_id, description, occurred_at, cards(title, customers(name))',
    )
    .eq('organization_id', organizationId)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (filter.dateFrom) {
    query = query.gte('occurred_at', filter.dateFrom);
  }

  if (filter.dateTo) {
    query = query.lte('occurred_at', filter.dateTo);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const card = Array.isArray(row.cards) ? row.cards[0] : row.cards;
    const customer = card?.customers
      ? Array.isArray(card.customers)
        ? card.customers[0]
        : card.customers
      : null;

    return {
      id: row.id as string,
      entryType: row.entry_type as AccountingEntryType,
      amount: Number(row.amount),
      customerName: (customer?.name as string | undefined) ?? null,
      cardTitle: (card?.title as string | undefined) ?? null,
      invoiceId: (row.invoice_id as string | null) ?? null,
      description: row.description as string,
      occurredAt: row.occurred_at as string,
    };
  });
}
