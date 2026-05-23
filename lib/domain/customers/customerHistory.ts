import type { SupabaseClient } from '@supabase/supabase-js';

import { listCardActivities } from '@/lib/domain/activities/listCardActivities';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';

export type CustomerHistorySummary = {
  customerId: string;
  customerName: string;
  jobCount: number;
  openJobs: Array<{ id: string; title: string; stateKey: string }>;
  recentActivity: Array<{ action: string; summary: string; createdAt: string }>;
};

export async function getCustomerHistory(
  client: SupabaseClient,
  organizationId: string,
  customerId: string,
): Promise<CustomerHistorySummary | null> {
  const { data: customer, error: customerError } = await client
    .from('customers')
    .select('id, name')
    .eq('id', customerId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (customerError || !customer) {
    return null;
  }

  const { data: cards, error: cardsError } = await client
    .from('cards')
    .select('id, title, archived_at, columns!inner(state_key)')
    .eq('organization_id', organizationId)
    .eq('customer_id', customerId)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (cardsError) {
    throw new Error(cardsError.message);
  }

  const openJobs = (cards ?? [])
    .filter((row) => !row.archived_at)
    .map((row) => {
      const column = Array.isArray(row.columns) ? row.columns[0] : row.columns;
      return {
        id: row.id as string,
        title: row.title as string,
        stateKey: (column?.state_key as string) ?? 'inquiry',
      };
    });

  const primaryCardId = openJobs[0]?.id ?? (cards?.[0]?.id as string | undefined);
  let recentActivity: CustomerHistorySummary['recentActivity'] = [];

  if (primaryCardId) {
    const activities = await listCardActivities(client, organizationId, primaryCardId);
    recentActivity = activities.slice(0, 10).map((item) => ({
      action: item.action,
      summary: item.summary,
      createdAt: item.createdAt,
    }));
  }

  return {
    customerId: customer.id as string,
    customerName: customer.name as string,
    jobCount: cards?.length ?? 0,
    openJobs,
    recentActivity,
  };
}

export async function summarizeCustomerHistoryText(
  client: SupabaseClient,
  organizationId: string,
  customerId: string,
): Promise<string> {
  const history = await getCustomerHistory(client, organizationId, customerId);
  if (!history) {
    throw new Error('Customer not found.');
  }

  const lines = [
    `${history.customerName} — ${history.jobCount} job(s) on file.`,
    history.openJobs.length
      ? `Open jobs: ${history.openJobs.map((job) => `${job.title} (${job.stateKey.replace(/_/g, ' ')})`).join(', ')}.`
      : 'No open jobs.',
  ];

  if (history.recentActivity.length) {
    lines.push(
      `Recent: ${history.recentActivity
        .slice(0, 3)
        .map((item) => item.summary)
        .join('; ')}.`,
    );
  }

  return lines.join(' ');
}

export async function getUnpaidInvoicesList(
  client: SupabaseClient,
  organizationId: string,
  minBalance = 0,
  limit = 20,
) {
  const { data, error } = await client
    .from('invoices')
    .select('id, card_id, total, balance_due, status, cards(title, customers(name))')
    .eq('organization_id', organizationId)
    .gt('balance_due', minBalance)
    .neq('status', 'paid')
    .order('balance_due', { ascending: false })
    .limit(limit);

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
      invoiceId: row.id as string,
      cardId: row.card_id as string,
      jobTitle: (card?.title as string | undefined) ?? 'Job',
      customerName: (customer?.name as string | undefined) ?? null,
      balanceDue: Number(row.balance_due),
      total: Number(row.total),
      status: row.status as string,
    };
  });
}
