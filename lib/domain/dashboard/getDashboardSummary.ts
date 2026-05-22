import type { SupabaseClient } from '@supabase/supabase-js';

export type DashboardSummary = {
  scheduledToday: number;
  overdueCount: number;
  unpaidBalance: number;
  pipelineSnapshot: Array<{ stateKey: string; count: number }>;
};

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfTodayIso(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export async function getDashboardSummary(
  client: SupabaseClient,
  organizationId: string,
): Promise<DashboardSummary> {
  const todayStart = startOfTodayIso();
  const todayEnd = endOfTodayIso();
  const now = new Date().toISOString();

  const { data: cards, error: cardsError } = await client
    .from('cards')
    .select('id, due_date, scheduled_start, archived_at, columns!inner(state_key)')
    .eq('organization_id', organizationId);

  if (cardsError) {
    throw new Error(cardsError.message);
  }

  const { data: invoices, error: invoicesError } = await client
    .from('invoices')
    .select('balance_due, status')
    .eq('organization_id', organizationId);

  if (invoicesError) {
    throw new Error(invoicesError.message);
  }

  let scheduledToday = 0;
  let overdueCount = 0;
  const snapshotMap = new Map<string, number>();

  for (const card of cards ?? []) {
    const column = Array.isArray(card.columns) ? card.columns[0] : card.columns;
    const stateKey = (column?.state_key as string) ?? 'unknown';
    snapshotMap.set(stateKey, (snapshotMap.get(stateKey) ?? 0) + 1);

    if (card.archived_at || stateKey === 'archived') {
      continue;
    }

    if (card.scheduled_start) {
      const start = new Date(card.scheduled_start as string).getTime();
      const dayStart = new Date(todayStart).getTime();
      const dayEnd = new Date(todayEnd).getTime();
      if (start >= dayStart && start <= dayEnd) {
        scheduledToday += 1;
      }
    }

    if (card.due_date && (card.due_date as string) < now.slice(0, 10)) {
      overdueCount += 1;
    }
  }

  const unpaidBalance = (invoices ?? [])
    .filter((row) => row.status !== 'paid')
    .reduce((sum, row) => sum + Number(row.balance_due), 0);

  return {
    scheduledToday,
    overdueCount,
    unpaidBalance: Math.round(unpaidBalance * 100) / 100,
    pipelineSnapshot: [...snapshotMap.entries()]
      .map(([stateKey, count]) => ({ stateKey, count }))
      .sort((a, b) => b.count - a.count),
  };
}
