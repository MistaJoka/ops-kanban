import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type ClientEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

let cachedClientEnv: ClientEnv | null = null;

export function getClientEnv(): ClientEnv {
  if (cachedClientEnv) {
    return cachedClientEnv;
  }

  const parsed = clientEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  cachedClientEnv = {
    supabaseUrl: parsed.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  return cachedClientEnv;
}
