import type { SupabaseClient } from '@supabase/supabase-js';

import type { AutomationView, CreateAutomationInput } from '@/lib/domain/automations/types';

function mapRow(row: Record<string, unknown>): AutomationView {
  return {
    id: row.id as string,
    name: row.name as string,
    triggerType: row.trigger_type as AutomationView['triggerType'],
    triggerStateKey: (row.trigger_state_key as string | null) ?? null,
    actionType: row.action_type as AutomationView['actionType'],
    actionConfig: (row.action_config as Record<string, unknown>) ?? {},
    active: Boolean(row.active),
    createdAt: row.created_at as string,
  };
}

export async function listAutomations(
  client: SupabaseClient,
  organizationId: string,
): Promise<AutomationView[]> {
  const { data, error } = await client
    .from('automations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapRow);
}

export async function createAutomation(
  client: SupabaseClient,
  input: CreateAutomationInput,
): Promise<AutomationView> {
  const { data, error } = await client
    .from('automations')
    .insert({
      organization_id: input.organizationId,
      name: input.name.trim(),
      trigger_type: input.triggerType,
      trigger_state_key: input.triggerStateKey ?? null,
      action_type: input.actionType,
      action_config: input.actionConfig,
      active: true,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create automation.');
  }

  return mapRow(data);
}

export async function deleteAutomation(
  client: SupabaseClient,
  organizationId: string,
  automationId: string,
): Promise<void> {
  const { error } = await client
    .from('automations')
    .delete()
    .eq('id', automationId)
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(error.message);
  }
}
