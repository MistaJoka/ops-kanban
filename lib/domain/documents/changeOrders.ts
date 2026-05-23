import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';
import { mapCardRowToBoardView } from '@/lib/domain/cards/boardCard';

export type ChangeOrderView = {
  id: string;
  title: string;
  parentCardId: string;
};

export async function createChangeOrder(
  client: SupabaseClient,
  params: {
    organizationId: string;
    parentCardId: string;
    actorId: string | null;
    title?: string;
    description?: string | null;
  },
): Promise<ChangeOrderView> {
  const parent = await getCardDetail(client, params.organizationId, params.parentCardId);
  if (!parent) {
    throw new Error('Parent job not found.');
  }

  const { data: parentRow, error: parentError } = await client
    .from('cards')
    .select('board_id, customer_id, column_id, columns!inner(state_key)')
    .eq('id', params.parentCardId)
    .eq('organization_id', params.organizationId)
    .single();

  if (parentError || !parentRow) {
    throw new Error('Parent job not found.');
  }

  const { data: estimatingColumn } = await client
    .from('columns')
    .select('id')
    .eq('organization_id', params.organizationId)
    .eq('board_id', parentRow.board_id)
    .eq('state_key', 'estimating')
    .single();

  if (!estimatingColumn) {
    throw new Error('Estimating column not found.');
  }

  const title = params.title?.trim() || `Change order — ${parent.title}`;

  const { data: card, error } = await client
    .from('cards')
    .insert({
      organization_id: params.organizationId,
      board_id: parentRow.board_id,
      column_id: estimatingColumn.id,
      customer_id: parentRow.customer_id,
      parent_card_id: params.parentCardId,
      title,
      description: params.description?.trim() || null,
      priority: 'medium',
      next_action: 'Scope change order and update estimate',
    })
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
    .single();

  if (error || !card) {
    throw new Error(error?.message ?? 'Failed to create change order.');
  }

  await logActivity(client, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    entityType: 'card',
    entityId: card.id,
    action: 'change_order.created',
    summary: `Created change order for "${parent.title}"`,
    metadata: { parent_card_id: params.parentCardId },
  });

  await logActivity(client, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    entityType: 'card',
    entityId: params.parentCardId,
    action: 'change_order.linked',
    summary: `Linked change order "${title}"`,
    metadata: { change_order_id: card.id },
  });

  const boardCard = mapCardRowToBoardView(card as Parameters<typeof mapCardRowToBoardView>[0]);

  return {
    id: boardCard.id,
    title: boardCard.title,
    parentCardId: params.parentCardId,
  };
}

export async function listChangeOrders(
  client: SupabaseClient,
  organizationId: string,
  parentCardId: string,
): Promise<ChangeOrderView[]> {
  const { data, error } = await client
    .from('cards')
    .select('id, title, parent_card_id')
    .eq('organization_id', organizationId)
    .eq('parent_card_id', parentCardId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    parentCardId: row.parent_card_id as string,
  }));
}
