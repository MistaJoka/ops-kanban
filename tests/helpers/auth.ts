import { randomUUID } from 'node:crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

import { bootstrapWorkspace } from '@/lib/domain/bootstrap/signupBootstrap';
import { createAnonClient, createServiceClient, deleteAuthUser } from '@/tests/helpers/supabase';

export type TestUser = {
  id: string;
  email: string;
  password: string;
  organizationId: string;
  boardId: string;
};

export async function createTestUser(label: string): Promise<TestUser> {
  const service = createServiceClient();
  const email = `test+${label}-${randomUUID()}@opsboard.test`;
  const password = `Test-${randomUUID().slice(0, 8)}!`;
  const fullName = `Test ${label}`;

  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? 'Failed to create test user');
  }

  const bootstrap = await bootstrapWorkspace(service, {
    userId: data.user.id,
    email,
    fullName,
    organizationName: `${fullName} Landscaping`,
  });

  return {
    id: data.user.id,
    email,
    password,
    organizationId: bootstrap.organizationId,
    boardId: bootstrap.boardId,
  };
}

export async function signInTestUser(
  client: SupabaseClient,
  email: string,
  password: string,
): Promise<void> {
  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteTestUser(user: TestUser): Promise<void> {
  const service = createServiceClient();
  await service.from('organizations').delete().eq('id', user.organizationId);
  await deleteAuthUser(user.id);
}

export function createUserClient(): SupabaseClient {
  return createAnonClient();
}
