import type { SupabaseClient } from '@supabase/supabase-js';

export type ScheduledCardView = {
  id: string;
  title: string;
  scheduledStart: string;
  scheduledEnd: string | null;
  stateKey: string;
  columnName: string;
  assigneeName: string | null;
  customerName: string | null;
  customerAddress: string | null;
};

export async function listScheduledCards(
  client: SupabaseClient,
  organizationId: string,
  range: { start: string; end: string },
): Promise<ScheduledCardView[]> {
  const { data, error } = await client
    .from('cards')
    .select(
      `
      id, title, scheduled_start, scheduled_end, assigned_to,
      columns!inner(name, state_key),
      customers(name, address)
    `,
    )
    .eq('organization_id', organizationId)
    .is('archived_at', null)
    .not('scheduled_start', 'is', null)
    .gte('scheduled_start', range.start)
    .lte('scheduled_start', range.end)
    .order('scheduled_start', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const column = Array.isArray(row.columns) ? row.columns[0] : row.columns;
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;

    return {
      id: row.id as string,
      title: row.title as string,
      scheduledStart: row.scheduled_start as string,
      scheduledEnd: (row.scheduled_end as string | null) ?? null,
      stateKey: column?.state_key as string,
      columnName: column?.name as string,
      assigneeName: null,
      customerName: (customer?.name as string | null) ?? null,
      customerAddress: (customer?.address as string | null) ?? null,
    };
  });
}
