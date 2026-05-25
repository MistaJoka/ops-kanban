import { NextResponse } from 'next/server';

import { withPublicRoute } from '@/lib/api/withApiRoute';
import { getGeminiModel } from '@/lib/ai/gemini-client';
import { createClient as createBrowserServerClient } from '@/lib/db/supabase/server';
import { createServiceClient } from '@/lib/db/supabase/service';
import { getClientEnv } from '@/lib/env/client';
import { getServerEnv } from '@/lib/env/server';

type CheckResult = {
  name: string;
  ok: boolean;
  detail?: string;
  error?: string;
};

async function runChecks(): Promise<{ ok: boolean; checks: CheckResult[] }> {
  const checks: CheckResult[] = [];

  try {
    const clientEnv = getClientEnv();
    checks.push({
      name: 'env.client',
      ok: true,
      detail: `Supabase URL host: ${new URL(clientEnv.supabaseUrl).host}`,
    });
  } catch (error) {
    checks.push({
      name: 'env.client',
      ok: false,
      error: error instanceof Error ? error.message : 'Client env validation failed',
    });
  }

  try {
    const serverEnv = getServerEnv();
    checks.push({
      name: 'env.server',
      ok: true,
      detail: `Service role + Gemini (${serverEnv.geminiApiKey ? 'present' : 'missing'})`,
    });
  } catch (error) {
    checks.push({
      name: 'env.server',
      ok: false,
      error: error instanceof Error ? error.message : 'Server env validation failed',
    });
  }

  try {
    const supabase = await createBrowserServerClient();
    const { error } = await supabase.auth.getSession();
    checks.push({
      name: 'supabase.anon.auth',
      ok: !error,
      detail: error ? undefined : 'Auth client reachable (no active session)',
      error: error?.message,
    });
  } catch (error) {
    checks.push({
      name: 'supabase.anon.auth',
      ok: false,
      error: error instanceof Error ? error.message : 'Anon client failed',
    });
  }

  try {
    const supabase = createServiceClient();
    const { error, count } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    if (error) {
      checks.push({
        name: 'supabase.service.db',
        ok: false,
        error: error.message,
        detail:
          error.code === 'PGRST205' || error.message.includes('does not exist')
            ? 'Migrations may not be applied yet (001_core_schema.sql+)'
            : undefined,
      });
    } else {
      checks.push({
        name: 'supabase.service.db',
        ok: true,
        detail: `organizations table reachable (${count ?? 0} rows)`,
      });
    }
  } catch (error) {
    checks.push({
      name: 'supabase.service.db',
      ok: false,
      error: error instanceof Error ? error.message : 'Service client DB check failed',
    });
  }

  try {
    const model = getGeminiModel();
    const result = await model.generateContent('Reply with exactly: pong');
    const text = result.response.text().trim().toLowerCase();

    checks.push({
      name: 'gemini.api',
      ok: text.includes('pong'),
      detail: text.includes('pong')
        ? 'Model responded to ping'
        : `Unexpected response: ${text.slice(0, 80)}`,
      error: text.includes('pong') ? undefined : 'Gemini response did not contain pong',
    });
  } catch (error) {
    checks.push({
      name: 'gemini.api',
      ok: false,
      error: error instanceof Error ? error.message : 'Gemini API call failed',
    });
  }

  return {
    ok: checks.every((check) => check.ok),
    checks,
  };
}

export async function GET(request: Request) {
  return withPublicRoute(
    request,
    async () => {
      try {
        const result = await runChecks();

        return NextResponse.json(
          {
            ok: result.ok,
            timestamp: new Date().toISOString(),
            checks: result.checks,
          },
          { status: result.ok ? 200 : 503 },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Connection probe failed';

        return NextResponse.json(
          {
            ok: false,
            error: message,
          },
          { status: 500 },
        );
      }
    },
    { route: '/api/health/connections' },
  );
}
