import type { SupabaseClient } from '@supabase/supabase-js';

import { getAssigneeInitials } from '@/lib/domain/cards/boardCardFormatters';
import { computeMoneyBadge, type MoneyBadge } from '@/lib/domain/cards/cardSignals';
import { COLUMN_CATEGORY, type ColumnCategory } from '@/lib/domain/pipeline/types';

export type { MoneyBadge };

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
  assignedTo: string | null;
  assigneeName: string | null;
  assigneeInitials: string | null;
  quoteTotal: number;
  balanceDue: number;
  columnEnteredAt: string;
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
  column_entered_at: string;
  customer_id: string | null;
  assigned_to: string | null;
  columns: { state_key: string } | { state_key: string }[] | null;
  profiles:
    | { full_name: string | null }
    | { full_name: string | null }[]
    | null;
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

function computeDaysInColumn(columnEnteredAt: string): number {
  const entered = new Date(columnEnteredAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - entered) / (1000 * 60 * 60 * 24)));
}

export function mapCardRowToBoardView(row: CardRow): BoardCardView {
  const column = relationOne(row.columns);
  const customer = relationOne(row.customers);
  const assignee = relationOne(row.profiles);
  const stateKey = column?.state_key ?? 'inquiry';
  const dueDate = row.due_date;
  const quote = row.quotes?.[0];
  const invoice = row.invoices?.[0];
  const assigneeName = assignee?.full_name ?? null;
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
    daysInColumn: computeDaysInColumn(row.column_entered_at ?? row.updated_at),
    isOverdue,
    moneyBadge: computeMoneyBadge(row.quotes, row.invoices),
    assignedTo: row.assigned_to,
    assigneeName,
    assigneeInitials: getAssigneeInitials(assigneeName),
    quoteTotal: quote?.total ?? 0,
    balanceDue: invoice?.balance_due ?? 0,
    columnEnteredAt: row.column_entered_at ?? row.updated_at,
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
      scheduled_start, next_action, updated_at, column_entered_at, customer_id,
      assigned_to,
      columns!inner(state_key),
      customers(name, address),
      profiles:assigned_to(full_name),
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
