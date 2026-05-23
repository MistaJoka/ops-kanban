import type { SupabaseClient } from '@supabase/supabase-js';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function checkMemoryRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}

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

  return checkMemoryRateLimit(key);
}
