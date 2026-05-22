import type { SupabaseClient } from '@supabase/supabase-js';

import { COLUMN_CATEGORY, type ColumnCategory } from '@/lib/domain/pipeline/types';

export type MoneyBadge =
  | 'none'
  | 'estimate_draft'
  | 'estimate_sent'
  | 'invoice_draft'
  | 'balance_due'
  | 'paid';

export type BoardCardView = {
  id: string;
  title: string;
  columnId: string;
  stateKey: string;
  columnCategory: ColumnCategory;
  priority: string;
  jobType: string | null;
  customerName: string | null;
  customerAddress: string | null;
  position: number;
  dueDate: string | null;
  scheduledStart: string | null;
  nextAction: string | null;
  daysInColumn: number;
  isOverdue: boolean;
  moneyBadge: MoneyBadge;
  updatedAt: string;
};

type CardRow = {
  id: string;
  title: string;
  column_id: string;
  priority: string | null;
  job_type: string | null;
  position: number;
  due_date: string | null;
  scheduled_start: string | null;
  next_action: string | null;
  updated_at: string;
  customer_id: string | null;
  columns: { state_key: string } | { state_key: string }[] | null;
  customers:
    | { name: string; address: string | null }
    | { name: string; address: string | null }[]
    | null;
  quotes: Array<{ status: string; total: number }> | null;
  invoices: Array<{ status: string; balance_due: number }> | null;
};

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function computeMoneyBadge(
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

function computeDaysInColumn(updatedAt: string): number {
  const updated = new Date(updatedAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - updated) / (1000 * 60 * 60 * 24)));
}

export function mapCardRowToBoardView(row: CardRow): BoardCardView {
  const column = relationOne(row.columns);
  const customer = relationOne(row.customers);
  const stateKey = column?.state_key ?? 'inquiry';
  const dueDate = row.due_date;
  const isOverdue = Boolean(
    dueDate && new Date(dueDate).getTime() < Date.now() && stateKey !== 'archived',
  );

  return {
    id: row.id,
    title: row.title,
    columnId: row.column_id,
    stateKey,
    columnCategory: COLUMN_CATEGORY[stateKey as keyof typeof COLUMN_CATEGORY] ?? 'sales',
    priority: row.priority ?? 'medium',
    jobType: row.job_type,
    customerName: customer?.name ?? null,
    customerAddress: customer?.address ?? null,
    position: Number(row.position),
    dueDate,
    scheduledStart: row.scheduled_start,
    nextAction: row.next_action,
    daysInColumn: computeDaysInColumn(row.updated_at),
    isOverdue,
    moneyBadge: computeMoneyBadge(row.quotes, row.invoices),
    updatedAt: row.updated_at,
  };
}

export async function fetchBoardCards(
  client: SupabaseClient,
  organizationId: string,
  boardId: string,
  includeArchived = false,
): Promise<BoardCardView[]> {
  let query = client
    .from('cards')
    .select(
      `
      id, title, column_id, priority, job_type, position, due_date,
      scheduled_start, next_action, updated_at, customer_id,
      columns!inner(state_key),
      customers(name, address),
      quotes(status, total),
      invoices(status, balance_due)
    `,
    )
    .eq('organization_id', organizationId)
    .eq('board_id', boardId)
    .order('position', { ascending: true });

  if (!includeArchived) {
    query = query.is('archived_at', null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapCardRowToBoardView(row as CardRow));
}
