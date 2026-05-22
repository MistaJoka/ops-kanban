import type { SupabaseClient } from '@supabase/supabase-js';

import { setOrganizationPipelineMode } from '@/lib/domain/board/syncFullPipeline';

import { getOrganizationSettings, type OrganizationSettings } from './getOrganizationSettings';

export type UpdateOrganizationSettingsInput = {
  name?: string;
  pipelineMode?: 'compact' | 'full';
};

export async function updateOrganizationSettings(
  client: SupabaseClient,
  organizationId: string,
  input: UpdateOrganizationSettingsInput,
): Promise<OrganizationSettings> {
  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed) {
      throw new Error('Organization name cannot be empty.');
    }

    const { error } = await client
      .from('organizations')
      .update({ name: trimmed })
      .eq('id', organizationId);

    if (error) {
      throw new Error(error.message);
    }
  }

  if (input.pipelineMode !== undefined) {
    await setOrganizationPipelineMode(client, organizationId, input.pipelineMode);
  }

  return getOrganizationSettings(client, organizationId);
}
