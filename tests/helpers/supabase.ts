import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getTestEnv } from '@/tests/helpers/env';

export function createServiceClient(): SupabaseClient {
  const { supabaseUrl, supabaseServiceRoleKey } = getTestEnv();

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createAnonClient(): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getTestEnv();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function deleteAuthUser(userId: string): Promise<void> {
  const service = createServiceClient();
  const { error } = await service.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(`Failed to delete auth user ${userId}: ${error.message}`);
  }
}
