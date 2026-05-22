import type { SupabaseClient } from '@supabase/supabase-js';

export type OrganizationSettings = {
  name: string;
  pipelineMode: 'compact' | 'full';
};

export async function getOrganizationSettings(
  client: SupabaseClient,
  organizationId: string,
): Promise<OrganizationSettings> {
  const { data, error } = await client
    .from('organizations')
    .select('name, settings')
    .eq('id', organizationId)
    .single();

  if (error || !data) {
    throw new Error('Organization not found.');
  }

  const settings =
    data.settings && typeof data.settings === 'object'
      ? (data.settings as Record<string, unknown>)
      : {};

  const pipelineMode =
    'pipelineMode' in settings && settings.pipelineMode === 'full' ? 'full' : 'compact';

  return {
    name: data.name,
    pipelineMode,
  };
}
