import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { OrgRole } from '@/lib/domain/auth/roles';
import { bootstrapWorkspace } from '@/lib/domain/bootstrap/signupBootstrap';
import { createServiceClient } from '@/lib/db/supabase/service';

const DEV_USER_EMAIL = 'dev-bypass@opsboard.local';
const DEV_ORG_NAME = 'Dev Workspace';

export type DevWorkspaceContext = {
  organizationId: string;
  boardId: string;
  role: OrgRole;
  displayName: string;
  client: SupabaseClient;
};

async function findDevMembership(
  service: SupabaseClient,
): Promise<{ organizationId: string; boardId: string; role: OrgRole } | null> {
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('id')
    .eq('email', DEV_USER_EMAIL)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  const { data: membership, error: membershipError } = await service
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', profile.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return null;
  }

  const { data: board, error: boardError } = await service
    .from('boards')
    .select('id')
    .eq('organization_id', membership.organization_id)
    .eq('is_primary', true)
    .maybeSingle();

  if (boardError || !board) {
    return null;
  }

  return {
    organizationId: membership.organization_id,
    boardId: board.id,
    role: membership.role as OrgRole,
  };
}

async function ensureDevAuthUser(service: SupabaseClient): Promise<string> {
  const { data: existingProfile } = await service
    .from('profiles')
    .select('id')
    .eq('email', DEV_USER_EMAIL)
    .maybeSingle();

  if (existingProfile) {
    return existingProfile.id;
  }

  const { data, error } = await service.auth.admin.createUser({
    email: DEV_USER_EMAIL,
    password: `Dev-${crypto.randomUUID().slice(0, 12)}!`,
    email_confirm: true,
    user_metadata: { full_name: 'Dev User' },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? 'Failed to create dev bypass user');
  }

  return data.user.id;
}

export async function ensureDevWorkspace(): Promise<DevWorkspaceContext> {
  const service = createServiceClient();
  const existing = await findDevMembership(service);

  if (existing) {
    return {
      ...existing,
      displayName: 'Dev mode (auth disabled)',
      client: service,
    };
  }

  const userId = await ensureDevAuthUser(service);
  const bootstrap = await bootstrapWorkspace(service, {
    userId,
    email: DEV_USER_EMAIL,
    fullName: 'Dev User',
    organizationName: DEV_ORG_NAME,
  });

  await service
    .from('organizations')
    .update({ settings: { devBypass: true, pipelineMode: 'compact' } })
    .eq('id', bootstrap.organizationId);

  return {
    organizationId: bootstrap.organizationId,
    boardId: bootstrap.boardId,
    role: 'owner',
    displayName: 'Dev mode (auth disabled)',
    client: service,
  };
}
