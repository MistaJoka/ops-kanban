import type { SupabaseClient } from '@supabase/supabase-js';

import { LANDSCAPING_DEFAULT_COLUMNS } from '@/lib/landscaping-default-columns';

export type BootstrapInput = {
  userId: string;
  email: string;
  fullName: string;
  organizationName: string;
};

export type BootstrapResult = {
  organizationId: string;
  boardId: string;
  columnIds: string[];
  alreadyBootstrapped: boolean;
};

export class BootstrapError extends Error {
  constructor(
    message: string,
    public readonly code: 'profile' | 'organization' | 'member' | 'board' | 'columns',
  ) {
    super(message);
    this.name = 'BootstrapError';
  }
}

async function findExistingBootstrap(
  client: SupabaseClient,
  userId: string,
): Promise<BootstrapResult | null> {
  const { data: membership, error: membershipError } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('role', 'owner')
    .maybeSingle();

  if (membershipError) {
    throw new BootstrapError(membershipError.message, 'member');
  }

  if (!membership) {
    return null;
  }

  const { data: board, error: boardError } = await client
    .from('boards')
    .select('id')
    .eq('organization_id', membership.organization_id)
    .eq('is_primary', true)
    .maybeSingle();

  if (boardError) {
    throw new BootstrapError(boardError.message, 'board');
  }

  if (!board) {
    return null;
  }

  const { data: columns, error: columnsError } = await client
    .from('columns')
    .select('id')
    .eq('board_id', board.id)
    .order('position', { ascending: true });

  if (columnsError) {
    throw new BootstrapError(columnsError.message, 'columns');
  }

  return {
    organizationId: membership.organization_id,
    boardId: board.id,
    columnIds: (columns ?? []).map((column) => column.id),
    alreadyBootstrapped: true,
  };
}

export async function bootstrapWorkspace(
  client: SupabaseClient,
  input: BootstrapInput,
): Promise<BootstrapResult> {
  const existing = await findExistingBootstrap(client, input.userId);
  if (existing) {
    return existing;
  }

  const { error: profileError } = await client.from('profiles').upsert(
    {
      id: input.userId,
      email: input.email,
      full_name: input.fullName,
    },
    { onConflict: 'id' },
  );

  if (profileError) {
    throw new BootstrapError(profileError.message, 'profile');
  }

  const { data: organization, error: organizationError } = await client
    .from('organizations')
    .insert({ name: input.organizationName })
    .select('id')
    .single();

  if (organizationError || !organization) {
    throw new BootstrapError(organizationError?.message ?? 'Organization insert failed', 'organization');
  }

  const { error: memberError } = await client.from('organization_members').insert({
    organization_id: organization.id,
    user_id: input.userId,
    role: 'owner',
  });

  if (memberError) {
    throw new BootstrapError(memberError.message, 'member');
  }

  const { data: board, error: boardError } = await client
    .from('boards')
    .insert({
      organization_id: organization.id,
      name: 'Job Pipeline',
      is_primary: true,
    })
    .select('id')
    .single();

  if (boardError || !board) {
    throw new BootstrapError(boardError?.message ?? 'Board insert failed', 'board');
  }

  const columnRows = LANDSCAPING_DEFAULT_COLUMNS.map((column) => ({
    organization_id: organization.id,
    board_id: board.id,
    name: column.name,
    position: column.position,
    state_key: column.stateKey,
  }));

  const { data: columns, error: columnsError } = await client
    .from('columns')
    .insert(columnRows)
    .select('id');

  if (columnsError || !columns) {
    throw new BootstrapError(columnsError?.message ?? 'Column insert failed', 'columns');
  }

  return {
    organizationId: organization.id,
    boardId: board.id,
    columnIds: columns.map((column) => column.id),
    alreadyBootstrapped: false,
  };
}

export async function getPrimaryBoardColumns(
  client: SupabaseClient,
  organizationId: string,
): Promise<Array<{ id: string; name: string; state_key: string; position: number }>> {
  const { data: board, error: boardError } = await client
    .from('boards')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('is_primary', true)
    .maybeSingle();

  if (boardError) {
    throw new Error(boardError.message);
  }

  if (!board) {
    return [];
  }

  const { data: columns, error: columnsError } = await client
    .from('columns')
    .select('id, name, state_key, position')
    .eq('board_id', board.id)
    .order('position', { ascending: true });

  if (columnsError) {
    throw new Error(columnsError.message);
  }

  return columns ?? [];
}

export async function getUserOrganization(
  client: SupabaseClient,
  userId: string,
): Promise<{ organizationId: string; role: string } | null> {
  const { data, error } = await client
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    organizationId: data.organization_id,
    role: data.role,
  };
}
