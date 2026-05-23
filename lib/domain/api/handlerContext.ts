import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import type { OrgRole } from '@/lib/domain/auth/roles';
import { getUserOrganization } from '@/lib/domain/bootstrap/signupBootstrap';
import { ensureDevWorkspace } from '@/lib/domain/dev/workspace';
import { createClient } from '@/lib/db/supabase/server';
import { isAuthDisabled } from '@/lib/env/authBypass';

export type HandlerContext = {
  client: SupabaseClient;
  organizationId: string;
  userId: string | null;
  role: OrgRole;
};

export async function getHandlerContext(): Promise<HandlerContext | NextResponse> {
  if (isAuthDisabled()) {
    const dev = await ensureDevWorkspace();
    const { data: profile } = await dev.client
      .from('profiles')
      .select('id')
      .eq('email', 'dev-bypass@opsboard.local')
      .maybeSingle();

    return {
      client: dev.client,
      organizationId: dev.organizationId,
      userId: profile?.id ?? null,
      role: dev.role,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const membership = await getUserOrganization(supabase, user.id);

  if (!membership) {
    return NextResponse.json(
      { error: 'Organization not found', code: 'FORBIDDEN' },
      { status: 403 },
    );
  }

  return {
    client: supabase,
    organizationId: membership.organizationId,
    userId: user.id,
    role: membership.role as OrgRole,
  };
}

export function isHandlerContext(value: HandlerContext | NextResponse): value is HandlerContext {
  return !(value instanceof NextResponse);
}
