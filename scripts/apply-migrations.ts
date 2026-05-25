import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MIGRATION_DIR = path.join(process.cwd(), 'supabase/migrations');

function migrationNameFromFile(file: string): string {
  return file.replace(/\.sql$/, '');
}

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

function missingDatabaseEnvMessage(): string {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasPassword = Boolean(process.env.SUPABASE_DB_PASSWORD);
  const hasDirectUrl = Boolean(process.env.SUPABASE_DB_URL);

  if (hasDirectUrl) {
    return 'SUPABASE_DB_URL is set but could not be used.';
  }

  const lines = [
    'Database credentials missing for npm run db:migrate.',
    '',
    'Add ONE of the following to .env.local:',
    '',
    'Option A (recommended):',
    '  SUPABASE_DB_PASSWORD=<your database password>',
    '  NEXT_PUBLIC_SUPABASE_URL=<already set>',
    '',
    'Option B:',
    '  SUPABASE_DB_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres',
    '',
    'Get the password: Supabase Dashboard → Project → Settings → Database → Database password',
    '(Reset password if you do not have it saved.)',
  ];

  if (hasUrl && !hasPassword) {
    lines.push('', 'Detected: NEXT_PUBLIC_SUPABASE_URL is set, but SUPABASE_DB_PASSWORD is empty.');
  }

  return lines.join('\n');
}

async function loadAppliedMigrationNames(client: import('pg').Client): Promise<Set<string>> {
  try {
    const result = await client.query<{ name: string }>(
      'select name from supabase_migrations.schema_migrations',
    );
    return new Set(result.rows.map((row) => row.name));
  } catch {
    return new Set();
  }
}

async function recordMigration(
  client: import('pg').Client,
  name: string,
  sql: string,
): Promise<void> {
  const version = `${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`;

  await client.query(
    `insert into supabase_migrations.schema_migrations (version, name, statements, created_by)
     values ($1, $2, $3::text[], 'apply-migrations')`,
    [version, name, [sql]],
  );
}

export async function applyMigrations(): Promise<void> {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    throw new Error(missingDatabaseEnvMessage());
  }

  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const applied = await loadAppliedMigrationNames(client);

  const files = readdirSync(MIGRATION_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  let appliedCount = 0;

  for (const file of files) {
    const name = migrationNameFromFile(file);
    if (applied.has(name)) {
      console.log(`Skipping ${file} (already applied).`);
      continue;
    }

    const sql = readFileSync(path.join(MIGRATION_DIR, file), 'utf8');
    console.log(`Applying ${file}...`);
    await client.query(sql);
    await recordMigration(client, name, sql);
    appliedCount += 1;
  }

  await client.end();

  if (appliedCount === 0) {
    console.log('No pending migrations.');
  }
}

async function main() {
  await applyMigrations();
  console.log('Migrations applied.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
