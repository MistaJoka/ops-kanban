import 'server-only';

import { redirect } from 'next/navigation';

import type { OrgRole } from '@/lib/domain/auth/roles';
import { ensureDevWorkspace } from '@/lib/domain/dev/workspace';
import {
  getPrimaryBoardColumns,
  getUserOrganization,
} from '@/lib/domain/bootstrap/signupBootstrap';
import { createClient } from '@/lib/db/supabase/server';
import { isAuthDisabled } from '@/lib/env/authBypass';

export type AppContext = {
  organizationId: string;
  userId: string | null;
  role: OrgRole;
  displayName: string;
  columnCount: number;
  authDisabled: boolean;
};

export async function getAppContext(): Promise<AppContext> {
  if (isAuthDisabled()) {
    const dev = await ensureDevWorkspace();
    const columns = await getPrimaryBoardColumns(dev.client, dev.organizationId);

    return {
      organizationId: dev.organizationId,
      userId:
        (
          await dev.client
            .from('profiles')
            .select('id')
            .eq('email', 'dev-bypass@opsboard.local')
            .single()
        ).data?.id ?? null,
      role: dev.role,
      displayName: dev.displayName,
      columnCount: columns.length,
      authDisabled: true,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const membership = await getUserOrganization(supabase, user.id);

  if (!membership) {
    redirect('/signup');
  }

  const columns = await getPrimaryBoardColumns(supabase, membership.organizationId);

  return {
    organizationId: membership.organizationId,
    userId: user.id,
    role: membership.role as OrgRole,
    displayName: user.email ?? 'Signed in',
    columnCount: columns.length,
    authDisabled: false,
  };
}

export async function getAppDataClient() {
  if (isAuthDisabled()) {
    const dev = await ensureDevWorkspace();
    return { client: dev.client, organizationId: dev.organizationId };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const membership = await getUserOrganization(supabase, user.id);

  if (!membership) {
    redirect('/signup');
  }

  return { client: supabase, organizationId: membership.organizationId };
}
