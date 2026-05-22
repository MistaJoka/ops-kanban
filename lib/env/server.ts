import 'server-only';

import { z } from 'zod';

import { isAuthDisabled } from '@/lib/env/authBypass';
import { getClientEnv } from '@/lib/env/client';

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1).optional(),
});

export type ServerEnv = ReturnType<typeof getClientEnv> & {
  supabaseServiceRoleKey: string;
  geminiApiKey?: string;
  disableAuth: boolean;
};

let cachedServerEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) {
    return cachedServerEnv;
  }

  const clientEnv = getClientEnv();
  const parsed = serverEnvSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  });

  cachedServerEnv = {
    ...clientEnv,
    supabaseServiceRoleKey: parsed.SUPABASE_SERVICE_ROLE_KEY,
    geminiApiKey: parsed.GEMINI_API_KEY,
    disableAuth: isAuthDisabled(),
  };

  return cachedServerEnv;
}

export { isAuthDisabled };
