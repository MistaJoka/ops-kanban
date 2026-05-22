import { describe, expect, it } from 'vitest';

import { createTestUser, createUserClient, deleteTestUser, signInTestUser } from '@/tests/helpers/auth';
import { hasTestSupabaseEnv } from '@/tests/helpers/env';
import { hasMigrationsApplied, hasWave1MigrationsApplied, hasWave2MigrationsApplied, hasWave3MigrationsApplied, hasWave4MigrationsApplied } from '@/tests/helpers/migrate';
import {
  ALL_ORG_SCOPED_TABLES,
  BASE_ORG_SCOPED_TABLES,
  WAVE1_ORG_SCOPED_TABLES,
  WAVE2_ORG_SCOPED_TABLES,
  WAVE3_ORG_SCOPED_TABLES,
  WAVE4_ORG_SCOPED_TABLES,
} from '@/tests/helpers/orgScopedTables';
import { createServiceClient } from '@/tests/helpers/supabase';

const integrationReady = hasTestSupabaseEnv() && (await hasMigrationsApplied());
const wave1Ready = integrationReady && (await hasWave1MigrationsApplied());
const wave2Ready = integrationReady && (await hasWave2MigrationsApplied());
const wave3Ready = integrationReady && (await hasWave3MigrationsApplied());
const wave4Ready = integrationReady && (await hasWave4MigrationsApplied());

function tablesForCurrentMigrations() {
  return [
    ...BASE_ORG_SCOPED_TABLES,
    ...(wave1Ready ? WAVE1_ORG_SCOPED_TABLES : []),
    ...(wave2Ready ? WAVE2_ORG_SCOPED_TABLES : []),
    ...(wave3Ready ? WAVE3_ORG_SCOPED_TABLES : []),
    ...(wave4Ready ? WAVE4_ORG_SCOPED_TABLES : []),
  ];
}

describe.skipIf(!integrationReady)('SEC-RLS org isolation', () => {
  it('SEC-RLS: user B cannot read org A rows on org-scoped tables', async () => {
    const userA = await createTestUser('rls-alpha');
    const userB = await createTestUser('rls-beta');
    const clientB = createUserClient();
    const tables = tablesForCurrentMigrations();

    try {
      await signInTestUser(clientB, userB.email, userB.password);

      for (const table of tables) {
        const { data, error } = await clientB
          .from(table)
          .select('*')
          .eq('organization_id', userA.organizationId);

        expect(error).toBeNull();
        expect(data ?? []).toHaveLength(0);
      }
    } finally {
      await deleteTestUser(userA);
      await deleteTestUser(userB);
    }
  });

  it('SEC-RLS: anon client cannot read organizations', async () => {
    const userA = await createTestUser('rls-anon');
    const anon = createUserClient();

    try {
      const { data, error } = await anon.from('organizations').select('*');

      expect(error).toBeNull();
      expect((data ?? []).every((row) => row.id !== userA.organizationId)).toBe(true);
    } finally {
      await deleteTestUser(userA);
    }
  });

  it('SEC-ROLE: owner membership is created on bootstrap', async () => {
    const user = await createTestUser('role-owner');

    try {
      const service = createServiceClient();
      const { data, error } = await service
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', user.organizationId)
        .single();

      expect(error).toBeNull();
      expect(data?.role).toBe('owner');
    } finally {
      await deleteTestUser(user);
    }
  });

  it('SEC-RLS-MATRIX: wave tables included when migrations applied', async () => {
    const tables = tablesForCurrentMigrations();
    expect(tables.length).toBeGreaterThanOrEqual(BASE_ORG_SCOPED_TABLES.length);
    if (wave4Ready) {
      for (const table of WAVE4_ORG_SCOPED_TABLES) {
        expect(tables).toContain(table);
      }
    }
    expect(ALL_ORG_SCOPED_TABLES).toHaveLength(26);
  });
});
