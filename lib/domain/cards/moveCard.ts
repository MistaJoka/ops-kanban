import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import { runAutomationsForColumnEnter } from '@/lib/domain/automations/runAutomations';
import type { OrgRole } from '@/lib/domain/auth/roles';
import { mapCardRowToBoardView, type BoardCardView } from '@/lib/domain/cards/boardCard';
import { computeInsertPosition } from '@/lib/domain/cards/cardPosition';
import { validateMove } from '@/lib/domain/pipeline/validateMove';

export type MoveCardInput = {
  organizationId: string;
  cardId: string;
  targetColumnId: string;
  actorId: string | null;
  role: OrgRole;
  reason?: string;
  insertIndex?: number;
};

export class MoveCardError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'MoveCardError';
  }
}

const CARD_SELECT = `
  id, title, column_id, priority, job_type, position, due_date,
  scheduled_start, next_action, updated_at, column_entered_at, customer_id,
  assigned_to, archived_at,
  columns!inner(state_key),
  customers(name, address),
  profiles:assigned_to(full_name),
  quotes(status, total, quote_items(id)),
  invoices(status, balance_due)
`;

export async function moveCard(
  client: SupabaseClient,
  input: MoveCardInput,
): Promise<BoardCardView> {
  const { data: card, error: cardError } = await client
    .from('cards')
    .select(CARD_SELECT)
    .eq('id', input.cardId)
    .eq('organization_id', input.organizationId)
    .single();

  if (cardError || !card) {
    throw new MoveCardError('Card not found.', 'NOT_FOUND');
  }

  const { data: targetColumn, error: targetError } = await client
    .from('columns')
    .select('id, state_key')
    .eq('id', input.targetColumnId)
    .eq('organization_id', input.organizationId)
    .single();

  if (targetError || !targetColumn) {
    throw new MoveCardError('Target column not found.', 'NOT_FOUND');
  }

  const fromColumn = Array.isArray(card.columns) ? card.columns[0] : card.columns;
  const fromStateKey = fromColumn?.state_key ?? 'inquiry';
  const quoteRow = (
    card.quotes as Array<{ total: number; quote_items?: Array<{ id: string }> }> | null
  )?.[0];
  const quoteTotal = quoteRow?.total ?? 0;
  const quoteLineItemCount = quoteRow?.quote_items?.length ?? 0;
  const balanceDue =
    (card.invoices as Array<{ balance_due: number }> | null)?.[0]?.balance_due ?? 0;

  const { data: orgRow } = await client
    .from('organizations')
    .select('settings')
    .eq('id', input.organizationId)
    .maybeSingle();

  const pipelineMode =
    orgRow?.settings &&
    typeof orgRow.settings === 'object' &&
    'pipelineMode' in orgRow.settings &&
    orgRow.settings.pipelineMode === 'full'
      ? 'full'
      : 'compact';

  const validation = validateMove({
    role: input.role,
    actorId: input.actorId,
    assignedToId: (card.assigned_to as string | null) ?? null,
    fromStateKey,
    toStateKey: targetColumn.state_key,
    scheduledStart: card.scheduled_start,
    quoteTotal,
    quoteLineItemCount,
    balanceDue: Number(balanceDue),
    hasCustomer: Boolean(card.customer_id),
    hasTitle: Boolean(card.title?.trim()),
    pipelineMode,
  });

  if (!validation.allowed) {
    throw new MoveCardError(
      validation.message ?? 'Move not allowed.',
      validation.code ?? 'VALIDATION_ERROR',
    );
  }

  if (validation.requiresReason && !input.reason?.trim()) {
    throw new MoveCardError(
      validation.message ?? 'A reason is required for this move.',
      'VALIDATION_ERROR',
    );
  }

  const now = new Date().toISOString();
  const columnChanged = card.column_id !== input.targetColumnId;

  let nextPosition: number | undefined;
  if (input.insertIndex !== undefined) {
    const { data: siblings, error: siblingsError } = await client
      .from('cards')
      .select('id, position')
      .eq('organization_id', input.organizationId)
      .eq('column_id', input.targetColumnId)
      .neq('id', input.cardId)
      .order('position', { ascending: true });

    if (siblingsError) {
      throw new MoveCardError(siblingsError.message, 'INTERNAL');
    }

    nextPosition = computeInsertPosition(
      (siblings ?? []).map((row) => ({ position: Number(row.position) })),
      input.insertIndex,
    );
  }

  const updatePayload: Record<string, unknown> = {
    column_id: input.targetColumnId,
    updated_at: now,
  };

  if (nextPosition !== undefined) {
    updatePayload.position = nextPosition;
  }

  if (columnChanged) {
    updatePayload.column_entered_at = now;
  }

  if (validation.setArchivedAt) {
    updatePayload.archived_at = now;
  } else if (targetColumn.state_key !== 'archived') {
    updatePayload.archived_at = null;
  }

  const { data: updated, error: updateError } = await client
    .from('cards')
    .update(updatePayload)
    .eq('id', input.cardId)
    .eq('organization_id', input.organizationId)
    .select(CARD_SELECT)
    .single();

  if (updateError || !updated) {
    throw new MoveCardError(updateError?.message ?? 'Failed to move card.', 'INTERNAL');
  }

  await logActivity(client, {
    organizationId: input.organizationId,
    actorId: input.actorId,
    entityType: 'card',
    entityId: input.cardId,
    action: 'card.moved',
    summary: `Moved "${card.title}" to ${targetColumn.state_key.replace(/_/g, ' ')}`,
    metadata: {
      from_state_key: fromStateKey,
      to_state_key: targetColumn.state_key,
      reason: input.reason ?? null,
    },
  });

  try {
    await runAutomationsForColumnEnter(client, {
      organizationId: input.organizationId,
      cardId: input.cardId,
      cardTitle: card.title as string,
      stateKey: targetColumn.state_key,
      actorId: input.actorId,
    });
  } catch {
    // Automations must not block card moves.
  }

  return mapCardRowToBoardView(updated as Parameters<typeof mapCardRowToBoardView>[0]);
}
