import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { getServerEnv } from '@/lib/env/server';

export function createServiceClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getServerEnv();

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
