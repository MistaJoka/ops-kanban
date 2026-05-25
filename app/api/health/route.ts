import { NextResponse } from 'next/server';

import { withPublicRoute } from '@/lib/api/withApiRoute';
import { createClient } from '@/lib/db/supabase/server';

export async function GET(request: Request) {
  return withPublicRoute(
    request,
    async () => {
      const supabase = await createClient();
      const { error } = await supabase.auth.getSession();

      return NextResponse.json({
        ok: !error,
        supabase: {
          connected: !error,
        },
      });
    },
    { route: '/api/health' },
  );
}
