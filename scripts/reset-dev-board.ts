import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import {
  findDevOrganizationId,
  resetOrganizationBoardData,
} from '@/lib/domain/dev/resetDevBoardData';
import { isAuthDisabled } from '@/lib/env/authBypass';

dotenv.config({ path: '.env.local' });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase env vars. Copy .env.example to .env.local first.');
    process.exit(1);
  }

  if (!isAuthDisabled()) {
    console.error('Set DISABLE_AUTH=true in .env.local to reset the dev workspace board.');
    process.exit(1);
  }

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const organizationId = await findDevOrganizationId(service);

  if (!organizationId) {
    console.error('Dev workspace not found. Start the app once to bootstrap it.');
    process.exit(1);
  }

  const result = await resetOrganizationBoardData(service, organizationId);

  console.log(`Dev workspace reset (${organizationId}):`);
  console.log(`  deleted cards:     ${result.deletedCards}`);
  console.log(`  deleted customers: ${result.deletedCustomers}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
