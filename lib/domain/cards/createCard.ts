import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import type { OrgRole } from '@/lib/domain/auth/roles';
import { canCreateCard } from '@/lib/domain/auth/roles';
import { mapCardRowToBoardView, type BoardCardView } from '@/lib/domain/cards/boardCard';
import { BOARD_CARD_SELECT } from '@/lib/domain/cards/cardSelect';
import { DomainError } from '@/lib/domain/errors';

export type CreateCardInput = {
  organizationId: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  jobType?: string;
  nextAction?: string;
  actorId: string | null;
  role: OrgRole;
};

export type CreateCardFromSystemInput = {
  organizationId: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  jobType?: string;
  nextAction?: string;
};

async function insertCardRow(
  client: SupabaseClient,
  input: {
    organizationId: string;
    boardId: string;
    columnId: string;
    title: string;
    description?: string;
    jobType?: string;
    nextAction?: string;
  },
) {
  const { data: column, error: columnError } = await client
    .from('columns')
    .select('id, board_id, state_key')
    .eq('id', input.columnId)
    .eq('organization_id', input.organizationId)
    .eq('board_id', input.boardId)
    .single();

  if (columnError || !column) {
    throw new Error('Column not found.');
  }

  const { data: card, error } = await client
    .from('cards')
    .insert({
      organization_id: input.organizationId,
      board_id: input.boardId,
      column_id: input.columnId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      job_type: input.jobType ?? null,
      next_action: input.nextAction?.trim() || null,
      priority: 'medium',
    })
    .select(BOARD_CARD_SELECT)
    .single();

  if (error || !card) {
    throw new Error(error?.message ?? 'Failed to create card.');
  }

  return { card, column };
}

export async function createCardFromSystem(
  client: SupabaseClient,
  input: CreateCardFromSystemInput,
): Promise<BoardCardView> {
  const { card, column } = await insertCardRow(client, input);

  await logActivity(client, {
    organizationId: input.organizationId,
    actorId: null,
    entityType: 'card',
    entityId: card.id,
    action: 'card.created',
    summary: `Created job "${input.title.trim()}" in ${column.state_key.replace('_', ' ')}`,
    metadata: {
      column_id: input.columnId,
      state_key: column.state_key,
      source: 'system',
    },
  });

  return mapCardRowToBoardView(card as Parameters<typeof mapCardRowToBoardView>[0]);
}

export async function createCard(
  client: SupabaseClient,
  input: CreateCardInput,
): Promise<BoardCardView> {
  if (!canCreateCard(input.role)) {
    throw new DomainError('Your role cannot create cards.', 'FORBIDDEN');
  }

  const { card, column } = await insertCardRow(client, input);

  await logActivity(client, {
    organizationId: input.organizationId,
    actorId: input.actorId,
    entityType: 'card',
    entityId: card.id,
    action: 'card.created',
    summary: `Created job "${input.title.trim()}" in ${column.state_key.replace('_', ' ')}`,
    metadata: {
      column_id: input.columnId,
      state_key: column.state_key,
    },
  });

  return mapCardRowToBoardView(card as Parameters<typeof mapCardRowToBoardView>[0]);
}
