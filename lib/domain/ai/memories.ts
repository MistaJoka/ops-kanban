import type { SupabaseClient } from '@supabase/supabase-js';

const ALLOWED_KEYS = new Set(['brand_voice']);

export type AiMemoryKey = 'brand_voice';

export function assertAllowedMemoryKey(key: string): AiMemoryKey {
  if (!ALLOWED_KEYS.has(key)) {
    throw new Error(`Memory key "${key}" is not allowed.`);
  }
  return key as AiMemoryKey;
}

export async function getOrgAiMemory(
  client: SupabaseClient,
  organizationId: string,
  memoryKey: AiMemoryKey,
): Promise<string | null> {
  const { data, error } = await client
    .from('ai_memories')
    .select('content')
    .eq('organization_id', organizationId)
    .eq('memory_key', memoryKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.content ?? null;
}

export async function setOrgAiMemory(
  client: SupabaseClient,
  organizationId: string,
  memoryKey: AiMemoryKey,
  content: string,
): Promise<void> {
  assertAllowedMemoryKey(memoryKey);

  const trimmed = content.trim();
  if (trimmed.length > 4000) {
    throw new Error('Memory content must be 4000 characters or less.');
  }

  const { error } = await client.from('ai_memories').upsert(
    {
      organization_id: organizationId,
      memory_key: memoryKey,
      content: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,memory_key' },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function loadOrgAiMemoriesForPrompt(
  client: SupabaseClient,
  organizationId: string,
): Promise<string | null> {
  const brandVoice = await getOrgAiMemory(client, organizationId, 'brand_voice');
  if (!brandVoice?.trim()) {
    return null;
  }

  return `Organization brand voice (apply to customer-facing drafts; never store PII here):\n${brandVoice.trim()}`;
}
