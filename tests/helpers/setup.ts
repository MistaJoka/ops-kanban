import { beforeAll, vi } from 'vitest';

import { hasTestSupabaseEnv } from '@/tests/helpers/env';
import { hasMigrationsApplied } from '@/tests/helpers/migrate';

vi.mock('server-only', () => ({}));

beforeAll(async () => {
  if (!hasTestSupabaseEnv()) {
    console.warn(
      'Supabase env vars missing — integration tests will skip via beforeAll hooks.',
    );
    return;
  }

  if (!(await hasMigrationsApplied())) {
    console.warn(
      'Migrations not applied — integration tests will skip. Run `npm run db:migrate` after setting SUPABASE_DB_PASSWORD.',
    );
  }
});
