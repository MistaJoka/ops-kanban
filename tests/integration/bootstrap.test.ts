import { describe, expect, it } from 'vitest';

import { LANDSCAPING_DEFAULT_COLUMNS } from '@/lib/landscaping-default-columns';
import { bootstrapWorkspace } from '@/lib/domain/bootstrap/signupBootstrap';
import { createTestUser, deleteTestUser } from '@/tests/helpers/auth';
import { hasTestSupabaseEnv } from '@/tests/helpers/env';
import { hasMigrationsApplied } from '@/tests/helpers/migrate';
import { createServiceClient } from '@/tests/helpers/supabase';

const integrationReady = hasTestSupabaseEnv() && (await hasMigrationsApplied());

describe.skipIf(!integrationReady)('INT-BOOT signup bootstrap', () => {
  it('INT-BOOT-001: signup creates 9 columns with expected state keys', async () => {
    const user = await createTestUser('boot-001');

    try {
      const service = createServiceClient();
      const { data: columns, error } = await service
        .from('columns')
        .select('name, state_key, position')
        .eq('board_id', user.boardId)
        .order('position', { ascending: true });

      expect(error).toBeNull();
      expect(columns).toHaveLength(9);
      expect(columns?.map((column) => column.state_key)).toEqual(
        LANDSCAPING_DEFAULT_COLUMNS.map((column) => column.stateKey),
      );
    } finally {
      await deleteTestUser(user);
    }
  });

  it('INT-BOOT-002: profile row references auth user', async () => {
    const user = await createTestUser('boot-002');

    try {
      const service = createServiceClient();
      const { data: profile, error } = await service
        .from('profiles')
        .select('id, email')
        .eq('id', user.id)
        .single();

      expect(error).toBeNull();
      expect(profile?.id).toBe(user.id);
      expect(profile?.email).toBe(user.email);
    } finally {
      await deleteTestUser(user);
    }
  });

  it('INT-BOOT-003: bootstrap is idempotent', async () => {
    const user = await createTestUser('boot-003');
    const service = createServiceClient();

    try {
      const first = await bootstrapWorkspace(service, {
        userId: user.id,
        email: user.email,
        fullName: 'Test boot-003',
        organizationName: 'Test boot-003 Landscaping',
      });

      const second = await bootstrapWorkspace(service, {
        userId: user.id,
        email: user.email,
        fullName: 'Test boot-003',
        organizationName: 'Test boot-003 Landscaping',
      });

      expect(first.organizationId).toBe(second.organizationId);
      expect(first.boardId).toBe(second.boardId);
      expect(second.alreadyBootstrapped).toBe(true);

      const { count } = await service
        .from('columns')
        .select('*', { count: 'exact', head: true })
        .eq('board_id', user.boardId);

      expect(count).toBe(9);
    } finally {
      await deleteTestUser(user);
    }
  });

  it('INT-BOOT-004 / NO_MOCK V1: bootstrap creates zero cards', async () => {
    const user = await createTestUser('boot-v1');

    try {
      const service = createServiceClient();
      const { count, error } = await service
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId);

      expect(error).toBeNull();
      expect(count).toBe(0);
    } finally {
      await deleteTestUser(user);
    }
  });
});
