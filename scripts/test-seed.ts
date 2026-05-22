import dotenv from 'dotenv';

import { createTestUser, deleteTestUser } from '@/tests/helpers/auth';
import { hasTestSupabaseEnv } from '@/tests/helpers/env';

dotenv.config({ path: '.env.local' });

async function main() {
  if (!hasTestSupabaseEnv()) {
    console.error('Missing Supabase env vars. Copy .env.example to .env.local first.');
    process.exit(1);
  }

  const alpha = await createTestUser('seed-alpha');
  const beta = await createTestUser('seed-beta');

  console.log('Seeded test orgs:');
  console.log(`  alpha: ${alpha.organizationId} (${alpha.email})`);
  console.log(`  beta:  ${beta.organizationId} (${beta.email})`);

  await deleteTestUser(alpha);
  await deleteTestUser(beta);

  console.log('Seed verification complete (fixtures torn down).');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
