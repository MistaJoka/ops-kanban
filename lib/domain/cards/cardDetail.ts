import type { SupabaseClient } from '@supabase/supabase-js';

import { COLUMN_CATEGORY, type ColumnCategory } from '@/lib/domain/pipeline/types';

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type CardCommentView = {
  id: string;
  body: string;
  authorName: string | null;
  createdAt: string;
};

export type CardActivityView = {
  id: string;
  action: string;
  summary: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type CardCustomerView = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
} | null;

export type CardDetailView = {
  id: string;
  title: string;
  description: string | null;
  columnId: string;
  stateKey: string;
  columnCategory: ColumnCategory;
  priority: string;
  jobType: string | null;
  nextAction: string | null;
  dueDate: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  assignedTo: string | null;
  assigneeName: string | null;
  revenueValue: number;
  checklist: ChecklistItem[];
  customer: CardCustomerView;
  quoteTotal: number;
  createdAt: string;
  updatedAt: string;
};

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function parseChecklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const record = item as Record<string, unknown>;
      return {
        id: String(record.id ?? `item-${index}`),
        text: String(record.text ?? ''),
        done: Boolean(record.done),
      };
    })
    .filter((item): item is ChecklistItem => Boolean(item?.text.trim()));
}

export async function getCardDetail(
  client: SupabaseClient,
  organizationId: string,
  cardId: string,
): Promise<CardDetailView | null> {
  const { data, error } = await client
    .from('cards')
    .select(
      `
      id, title, description, column_id, priority, job_type, next_action,
      due_date, scheduled_start, scheduled_end, assigned_to, revenue_value,
      checklist_json, created_at, updated_at, customer_id,
      columns!inner(state_key),
      customers(id, name, phone, email, address, notes),
      quotes(total),
      profiles:assigned_to(full_name)
    `,
    )
    .eq('id', cardId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const column = relationOne(data.columns);
  const customer = relationOne(data.customers);
  const assignee = relationOne(data.profiles);
  const stateKey = column?.state_key ?? 'inquiry';
  const quoteTotal = (data.quotes as Array<{ total: number }> | null)?.[0]?.total ?? 0;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    columnId: data.column_id,
    stateKey,
    columnCategory: COLUMN_CATEGORY[stateKey as keyof typeof COLUMN_CATEGORY] ?? 'sales',
    priority: data.priority ?? 'medium',
    jobType: data.job_type,
    nextAction: data.next_action,
    dueDate: data.due_date,
    scheduledStart: data.scheduled_start,
    scheduledEnd: data.scheduled_end,
    assignedTo: data.assigned_to,
    assigneeName: assignee?.full_name ?? null,
    revenueValue: Number(data.revenue_value ?? 0),
    checklist: parseChecklist(data.checklist_json),
    customer: customer
      ? {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          notes: customer.notes,
        }
      : null,
    quoteTotal,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export type UpdateCardInput = {
  organizationId: string;
  cardId: string;
  actorId: string | null;
  patch: {
    title?: string;
    description?: string | null;
    priority?: string;
    jobType?: string | null;
    nextAction?: string | null;
    dueDate?: string | null;
    scheduledStart?: string | null;
    scheduledEnd?: string | null;
    assignedTo?: string | null;
    checklist?: ChecklistItem[];
    customerId?: string | null;
  };
};

export async function updateCard(
  client: SupabaseClient,
  input: UpdateCardInput,
): Promise<CardDetailView> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.patch.title !== undefined) payload.title = input.patch.title.trim();
  if (input.patch.description !== undefined) payload.description = input.patch.description;
  if (input.patch.priority !== undefined) payload.priority = input.patch.priority;
  if (input.patch.jobType !== undefined) payload.job_type = input.patch.jobType;
  if (input.patch.nextAction !== undefined) payload.next_action = input.patch.nextAction;
  if (input.patch.dueDate !== undefined) payload.due_date = input.patch.dueDate;
  if (input.patch.scheduledStart !== undefined) payload.scheduled_start = input.patch.scheduledStart;
  if (input.patch.scheduledEnd !== undefined) payload.scheduled_end = input.patch.scheduledEnd;
  if (input.patch.assignedTo !== undefined) payload.assigned_to = input.patch.assignedTo;
  if (input.patch.checklist !== undefined) payload.checklist_json = input.patch.checklist;
  if (input.patch.customerId !== undefined) payload.customer_id = input.patch.customerId;

  const { error } = await client
    .from('cards')
    .update(payload)
    .eq('id', input.cardId)
    .eq('organization_id', input.organizationId);

  if (error) {
    throw new Error(error.message);
  }

  const { logActivity } = await import('@/lib/domain/activities/logActivity');
  await logActivity(client, {
    organizationId: input.organizationId,
    actorId: input.actorId,
    entityType: 'card',
    entityId: input.cardId,
    action: 'card.updated',
    summary: `Updated job details`,
    metadata: { fields: Object.keys(input.patch) },
  });

  const detail = await getCardDetail(client, input.organizationId, input.cardId);
  if (!detail) {
    throw new Error('Card not found after update.');
  }

  return detail;
}
