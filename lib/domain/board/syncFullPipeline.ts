import type { SupabaseClient } from '@supabase/supabase-js';

import { LANDSCAPING_FULL_PIPELINE } from '@/lib/landscaping-full-pipeline';

export async function ensureFullPipelineColumns(
  client: SupabaseClient,
  organizationId: string,
  boardId: string,
): Promise<void> {
  const { data: existing, error } = await client
    .from('columns')
    .select('state_key')
    .eq('organization_id', organizationId)
    .eq('board_id', boardId);

  if (error) {
    throw new Error(error.message);
  }

  const existingKeys = new Set((existing ?? []).map((row) => row.state_key as string));
  const missing = LANDSCAPING_FULL_PIPELINE.filter((column) => !existingKeys.has(column.stateKey));

  if (!missing.length) {
    return;
  }

  const { error: insertError } = await client.from('columns').insert(
    missing.map((column) => ({
      organization_id: organizationId,
      board_id: boardId,
      name: column.name,
      position: column.position,
      state_key: column.stateKey,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function setOrganizationPipelineMode(
  client: SupabaseClient,
  organizationId: string,
  pipelineMode: 'compact' | 'full',
): Promise<'compact' | 'full'> {
  const { data: org, error: orgError } = await client
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single();

  if (orgError || !org) {
    throw new Error('Organization not found.');
  }

  const settings =
    org.settings && typeof org.settings === 'object' ? { ...(org.settings as Record<string, unknown>) } : {};

  settings.pipelineMode = pipelineMode;

  const { error: updateError } = await client
    .from('organizations')
    .update({ settings })
    .eq('id', organizationId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (pipelineMode === 'full') {
    const { data: board } = await client
      .from('boards')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_primary', true)
      .single();

    if (board) {
      await ensureFullPipelineColumns(client, organizationId, board.id);
    }
  }

  return pipelineMode;
}
