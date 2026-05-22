import { NextResponse } from 'next/server';

import { createClient } from '@/lib/db/supabase/server';
import { getClientEnv } from '@/lib/env/client';
import { getServerEnv } from '@/lib/env/server';

export async function GET() {
  try {
    getClientEnv();
    const serverEnv = getServerEnv();

    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();

    return NextResponse.json({
      ok: true,
      env: {
        supabaseUrl: true,
        supabaseAnonKey: true,
        supabaseServiceRoleKey: true,
        geminiApiKey: Boolean(serverEnv.geminiApiKey),
      },
      supabase: {
        connected: !error,
        error: error?.message ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown health check error';

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
