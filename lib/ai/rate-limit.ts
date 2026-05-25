import type { SupabaseClient } from '@supabase/supabase-js';

import { checkMemoryRateLimit } from '@/lib/api/publicRateLimit';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

export async function checkRateLimit(
  key: string,
  client?: SupabaseClient,
  userId?: string | null,
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  if (client && userId) {
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const { count, error } = await client
      .from('ai_tool_calls')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since);

    if (!error && typeof count === 'number' && count >= MAX_REQUESTS) {
      return { allowed: false, retryAfterMs: WINDOW_MS };
    }
  }

  return checkMemoryRateLimit(key, MAX_REQUESTS, WINDOW_MS);
}
