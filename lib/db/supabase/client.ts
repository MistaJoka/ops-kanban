import { createBrowserClient } from '@supabase/ssr';

import { getClientEnv } from '@/lib/env/client';

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getClientEnv();

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
