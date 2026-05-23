import type { SupabaseClient } from '@supabase/supabase-js';

export type ColumnConversionRow = {
  stateKey: string;
  count: number;
};

export type RevenueByJobTypeRow = {
  jobType: string;
  revenue: number;
  jobCount: number;
};

export type ReportsSummary = {
  conversionByColumn: ColumnConversionRow[];
  avgCycleDays: number | null;
  archivedCount: number;
  revenueByJobType: RevenueByJobTypeRow[];
  totalRevenue: number;
  unpaidBalance: number;
  dateFrom: string | null;
  dateTo: string | null;
};

export type ReportsFilter = {
  dateFrom?: string | null;
  dateTo?: string | null;
};

export async function getReportsSummary(
  client: SupabaseClient,
  organizationId: string,
  filter: ReportsFilter = {},
): Promise<ReportsSummary> {
  let query = client
    .from('cards')
    .select(
      'id, job_type, archived_at, created_at, columns!inner(state_key), invoices(total, balance_due, status)',
    )
    .eq('organization_id', organizationId);

  if (filter.dateFrom) {
    query = query.gte('created_at', filter.dateFrom);
  }

  if (filter.dateTo) {
    query = query.lte('created_at', filter.dateTo);
  }

  const { data: cards, error: cardsError } = await query;

  if (cardsError) {
    throw new Error(cardsError.message);
  }

  const conversionMap = new Map<string, number>();
  let archivedCount = 0;
  let cycleTotalDays = 0;
  let cycleSamples = 0;
  const revenueMap = new Map<string, { revenue: number; jobCount: number }>();
  let totalRevenue = 0;
  let unpaidBalance = 0;

  for (const card of cards ?? []) {
    const column = Array.isArray(card.columns) ? card.columns[0] : card.columns;
    const stateKey = (column?.state_key as string) ?? 'unknown';
    conversionMap.set(stateKey, (conversionMap.get(stateKey) ?? 0) + 1);

    if (card.archived_at && card.created_at) {
      archivedCount += 1;
      const created = new Date(card.created_at as string).getTime();
      const archived = new Date(card.archived_at as string).getTime();
      const days = Math.max(0, (archived - created) / 86_400_000);
      cycleTotalDays += days;
      cycleSamples += 1;
    }

    const invoices =
      (card.invoices as Array<{ total: number; balance_due: number; status: string }> | null) ?? [];
    const invoice = invoices[0];
    if (invoice) {
      const total = Number(invoice.total);
      totalRevenue += total;
      if (invoice.status !== 'paid') {
        unpaidBalance += Number(invoice.balance_due);
      }
    }

    const jobType = (card.job_type as string | null)?.trim() || 'Unspecified';
    const bucket = revenueMap.get(jobType) ?? { revenue: 0, jobCount: 0 };
    bucket.jobCount += 1;
    if (invoice) {
      bucket.revenue += Number(invoice.total);
    }
    revenueMap.set(jobType, bucket);
  }

  return {
    conversionByColumn: [...conversionMap.entries()]
      .map(([stateKey, count]) => ({ stateKey, count }))
      .sort((a, b) => b.count - a.count),
    avgCycleDays: cycleSamples > 0 ? Math.round((cycleTotalDays / cycleSamples) * 10) / 10 : null,
    archivedCount,
    revenueByJobType: [...revenueMap.entries()]
      .map(([jobType, stats]) => ({
        jobType,
        revenue: Math.round(stats.revenue * 100) / 100,
        jobCount: stats.jobCount,
      }))
      .sort((a, b) => b.revenue - a.revenue),
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    unpaidBalance: Math.round(unpaidBalance * 100) / 100,
    dateFrom: filter.dateFrom ?? null,
    dateTo: filter.dateTo ?? null,
  };
}
