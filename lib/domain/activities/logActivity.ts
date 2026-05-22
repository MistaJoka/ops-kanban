import type { SupabaseClient } from '@supabase/supabase-js';

export type LogActivityInput = {
  organizationId: string;
  actorId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function logActivity(
  client: SupabaseClient,
  input: LogActivityInput,
): Promise<void> {
  const { error } = await client.from('activities').insert({
    organization_id: input.organizationId,
    actor_id: input.actorId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    summary: input.summary,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }
}
