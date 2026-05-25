import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import { runAutomationsForColumnEnter } from '@/lib/domain/automations/runAutomations';
import type { OrgRole } from '@/lib/domain/auth/roles';
import { canMoveCardOnBoard, type CardAuthContext } from '@/lib/domain/cards/authorizeCardMutation';
import { mapCardRowToBoardView, type BoardCardView } from '@/lib/domain/cards/boardCard';
import { BOARD_CARD_SELECT } from '@/lib/domain/cards/cardSelect';
import { computeInsertPosition } from '@/lib/domain/cards/cardPosition';
import { validateMove } from '@/lib/domain/pipeline/validateMove';

export { computeInsertPosition } from '@/lib/domain/cards/cardPosition';

export type ReorderCardInput = {
  organizationId: string;
  cardId: string;
  insertIndex: number;
  targetColumnId?: string;
  actorId: string | null;
  role: OrgRole;
  reason?: string;
};

export class ReorderCardError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'ReorderCardError';
  }
}

type PositionRow = { id: string; position: number };

async function fetchColumnCards(
  client: SupabaseClient,
  organizationId: string,
  columnId: string,
  excludeCardId: string,
): Promise<PositionRow[]> {
  const { data, error } = await client
    .from('cards')
    .select('id, position')
    .eq('organization_id', organizationId)
    .eq('column_id', columnId)
    .neq('id', excludeCardId)
    .order('position', { ascending: true });

  if (error) {
    throw new ReorderCardError(error.message, 'INTERNAL');
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    position: Number(row.position),
  }));
}

export async function reorderCard(
  client: SupabaseClient,
  input: ReorderCardInput,
): Promise<BoardCardView> {
  const { data: card, error: cardError } = await client
    .from('cards')
    .select(BOARD_CARD_SELECT)
    .eq('id', input.cardId)
    .eq('organization_id', input.organizationId)
    .single();

  if (cardError || !card) {
    throw new ReorderCardError('Card not found.', 'NOT_FOUND');
  }

  const authContext: CardAuthContext = {
    assignedTo: (card.assigned_to as string | null) ?? null,
  };

  if (!canMoveCardOnBoard(input.role, authContext, input.actorId)) {
    throw new ReorderCardError('Your role cannot move this job.', 'FORBIDDEN');
  }

  const targetColumnId = input.targetColumnId ?? (card.column_id as string);
  const columnChanged = card.column_id !== targetColumnId;

  const { data: targetColumn, error: targetError } = await client
    .from('columns')
    .select('id, state_key')
    .eq('id', targetColumnId)
    .eq('organization_id', input.organizationId)
    .single();

  if (targetError || !targetColumn) {
    throw new ReorderCardError('Target column not found.', 'NOT_FOUND');
  }

  const fromColumn = Array.isArray(card.columns) ? card.columns[0] : card.columns;
  const fromStateKey = fromColumn?.state_key ?? 'inquiry';

  let moveValidation: ReturnType<typeof validateMove> | null = null;

  if (columnChanged) {
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

    moveValidation = validateMove({
      role: input.role,
      actorId: input.actorId,
      assignedToId: authContext.assignedTo,
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

    if (!moveValidation.allowed) {
      throw new ReorderCardError(
        moveValidation.message ?? 'Move not allowed.',
        moveValidation.code ?? 'VALIDATION_ERROR',
      );
    }

    if (moveValidation.requiresReason && !input.reason?.trim()) {
      throw new ReorderCardError(
        moveValidation.message ?? 'A reason is required for this move.',
        'VALIDATION_ERROR',
      );
    }
  }

  const siblings = await fetchColumnCards(
    client,
    input.organizationId,
    targetColumnId,
    input.cardId,
  );
  const nextPosition = computeInsertPosition(siblings, input.insertIndex);

  const now = new Date().toISOString();
  const updatePayload: Record<string, unknown> = {
    position: nextPosition,
    updated_at: now,
  };

  if (columnChanged) {
    updatePayload.column_id = targetColumnId;
    updatePayload.column_entered_at = now;

    if (moveValidation?.setArchivedAt) {
      updatePayload.archived_at = now;
    } else if (targetColumn.state_key !== 'archived') {
      updatePayload.archived_at = null;
    }
  }

  const { data: updated, error: updateError } = await client
    .from('cards')
    .update(updatePayload)
    .eq('id', input.cardId)
    .eq('organization_id', input.organizationId)
    .select(BOARD_CARD_SELECT)
    .single();

  if (updateError || !updated) {
    throw new ReorderCardError(updateError?.message ?? 'Failed to reorder card.', 'INTERNAL');
  }

  await logActivity(client, {
    organizationId: input.organizationId,
    actorId: input.actorId,
    entityType: 'card',
    entityId: input.cardId,
    action: columnChanged ? 'card.moved' : 'card.reordered',
    summary: columnChanged
      ? `Moved "${card.title}" to ${targetColumn.state_key.replace(/_/g, ' ')}`
      : `Reordered "${card.title}" in ${targetColumn.state_key.replace(/_/g, ' ')}`,
    metadata: {
      from_state_key: fromStateKey,
      to_state_key: targetColumn.state_key,
      insert_index: input.insertIndex,
      position: nextPosition,
      reason: input.reason ?? null,
    },
  });

  if (columnChanged) {
    try {
      await runAutomationsForColumnEnter(client, {
        organizationId: input.organizationId,
        cardId: input.cardId,
        cardTitle: card.title as string,
        stateKey: targetColumn.state_key,
        actorId: input.actorId,
      });
    } catch {
      // Automations must not block card reorders.
    }
  }

  return mapCardRowToBoardView(updated as Parameters<typeof mapCardRowToBoardView>[0]);
}
