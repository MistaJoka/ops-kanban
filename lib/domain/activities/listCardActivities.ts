import type { SupabaseClient } from '@supabase/supabase-js';

import type { CardActivityView } from '@/lib/domain/cards/cardDetail';

export async function listCardActivities(
  client: SupabaseClient,
  organizationId: string,
  cardId: string,
): Promise<CardActivityView[]> {
  const { data, error } = await client
    .from('activities')
    .select('id, action, summary, metadata, created_at')
    .eq('organization_id', organizationId)
    .eq('entity_id', cardId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    summary: row.summary,
    createdAt: row.created_at,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }));
}
