import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MIGRATION_DIR = path.join(process.cwd(), 'supabase/migrations');

function getDatabaseUrl(): string | null {
  if (process.env.SUPABASE_DB_URL) {
    return process.env.SUPABASE_DB_URL;
  }

  const password = process.env.SUPABASE_DB_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!password || !supabaseUrl) {
    return null;
  }

  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    return null;
  }

  return `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;
}

export async function applyMigrations(): Promise<void> {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    throw new Error(
      'Set SUPABASE_DB_URL or SUPABASE_DB_PASSWORD (with NEXT_PUBLIC_SUPABASE_URL) to apply migrations.',
    );
  }

  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();

  const files = readdirSync(MIGRATION_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = readFileSync(path.join(MIGRATION_DIR, file), 'utf8');
    console.log(`Applying ${file}...`);
    await client.query(sql);
  }

  await client.end();
}

async function main() {
  await applyMigrations();
  console.log('Migrations applied.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
