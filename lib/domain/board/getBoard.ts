import type { SupabaseClient } from '@supabase/supabase-js';

import { fetchBoardCards, type BoardCardView } from '@/lib/domain/cards/boardCard';
import { COMPACT_STATE_ORDER, FULL_STATE_ORDER } from '@/lib/domain/pipeline/types';
import { LANDSCAPING_FULL_PIPELINE, type PipelineGroupKey } from '@/lib/landscaping-full-pipeline';

export type BoardColumnView = {
  id: string;
  name: string;
  stateKey: string;
  position: number;
  groupKey?: PipelineGroupKey;
};

export type BoardView = {
  id: string;
  name: string;
  columns: BoardColumnView[];
  cards: BoardCardView[];
  pipelineMode: 'compact' | 'full';
};

export async function getPrimaryBoard(
  client: SupabaseClient,
  organizationId: string,
  includeArchived = false,
): Promise<BoardView> {
  const { data: org, error: orgError } = await client
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single();

  if (orgError) {
    throw new Error(orgError.message);
  }

  const pipelineMode =
    org?.settings &&
    typeof org.settings === 'object' &&
    'pipelineMode' in org.settings &&
    org.settings.pipelineMode === 'full'
      ? 'full'
      : 'compact';

  const { data: board, error: boardError } = await client
    .from('boards')
    .select('id, name')
    .eq('organization_id', organizationId)
    .eq('is_primary', true)
    .single();

  if (boardError || !board) {
    throw new Error('Primary board not found.');
  }

  const { data: columns, error: columnsError } = await client
    .from('columns')
    .select('id, name, state_key, position')
    .eq('board_id', board.id)
    .eq('organization_id', organizationId)
    .order('position', { ascending: true });

  if (columnsError) {
    throw new Error(columnsError.message);
  }

  const cards = await fetchBoardCards(client, organizationId, board.id, includeArchived);

  const groupByState = new Map(
    LANDSCAPING_FULL_PIPELINE.map((column) => [column.stateKey, column.groupKey]),
  );
  const order = pipelineMode === 'full' ? FULL_STATE_ORDER : COMPACT_STATE_ORDER;
  const orderIndex = new Map(order.map((key, index) => [key, index]));

  const mappedColumns = (columns ?? [])
    .filter((column) => orderIndex.has(column.state_key))
    .sort(
      (a, b) =>
        (orderIndex.get(a.state_key) ?? 999) - (orderIndex.get(b.state_key) ?? 999),
    )
    .map((column) => ({
      id: column.id,
      name: column.name,
      stateKey: column.state_key,
      position: Number(column.position),
      groupKey: groupByState.get(column.state_key),
    }));

  return {
    id: board.id,
    name: board.name,
    pipelineMode,
    columns: mappedColumns,
    cards,
  };
}
