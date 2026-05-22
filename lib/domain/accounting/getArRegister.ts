import type { SupabaseClient } from '@supabase/supabase-js';

export type ArAgingBucket = 'current' | '30' | '60' | '90+';

export type ArRegisterRow = {
  invoiceId: string;
  cardId: string;
  customerName: string;
  cardTitle: string;
  balanceDue: number;
  total: number;
  dueDate: string | null;
  daysPastDue: number;
  agingBucket: ArAgingBucket;
  status: string;
};

function computeAgingBucket(daysPastDue: number): ArAgingBucket {
  if (daysPastDue <= 0) return 'current';
  if (daysPastDue <= 30) return '30';
  if (daysPastDue <= 60) return '60';
  return '90+';
}

export async function getArRegister(
  client: SupabaseClient,
  organizationId: string,
): Promise<ArRegisterRow[]> {
  const { data, error } = await client
    .from('invoices')
    .select(
      'id, card_id, status, total, balance_due, due_date, cards(title, customers(name))',
    )
    .eq('organization_id', organizationId)
    .neq('status', 'paid')
    .neq('status', 'void')
    .gt('balance_due', 0)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  const now = Date.now();

  return (data ?? []).map((row) => {
    const card = Array.isArray(row.cards) ? row.cards[0] : row.cards;
    const customer = card?.customers
      ? Array.isArray(card.customers)
        ? card.customers[0]
        : card.customers
      : null;
    const dueDate = (row.due_date as string | null) ?? null;
    const dueMs = dueDate ? new Date(dueDate).getTime() : now;
    const daysPastDue = Math.max(0, Math.floor((now - dueMs) / 86_400_000));

    return {
      invoiceId: row.id as string,
      cardId: row.card_id as string,
      customerName: (customer?.name as string | undefined) ?? 'Unknown customer',
      cardTitle: (card?.title as string | undefined) ?? 'Job',
      balanceDue: Number(row.balance_due),
      total: Number(row.total),
      dueDate,
      daysPastDue,
      agingBucket: computeAgingBucket(daysPastDue),
      status: row.status as string,
    };
  });
}

export type ArAgingSummary = Record<ArAgingBucket, number>;

export function summarizeArAging(rows: ArRegisterRow[]): ArAgingSummary {
  const summary: ArAgingSummary = { current: 0, '30': 0, '60': 0, '90+': 0 };
  for (const row of rows) {
    summary[row.agingBucket] += row.balanceDue;
  }
  for (const key of Object.keys(summary) as ArAgingBucket[]) {
    summary[key] = Math.round(summary[key] * 100) / 100;
  }
  return summary;
}
