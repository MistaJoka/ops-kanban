#!/usr/bin/env node
/**
 * Documentation drift checks — front/back collision detection.
 * See docs/roadmap/AI_BUILD_PROTOCOL.md § Layer 6.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let failed = false;

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function fail(msg) {
  console.error(`check-doc-sync: FAIL — ${msg}`);
  failed = true;
}

function pass(msg) {
  console.log(`check-doc-sync: OK — ${msg}`);
}

function walkRoutes(dir, base = '') {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      out.push(...walkRoutes(full, `${base}/${name}`));
    } else if (name === 'route.ts') {
      out.push(`/api${base}`);
    }
  }
  return out;
}

function highestMigrationNumber() {
  const dir = path.join(ROOT, 'supabase/migrations');
  const nums = fs
    .readdirSync(dir)
    .map((f) => /^(\d+)_/.exec(f)?.[1])
    .filter(Boolean)
    .map(Number);
  return Math.max(...nums);
}

function migrationToken(n) {
  const padded = String(n).padStart(3, '0');
  return `\`${padded}\``;
}

console.log('check-doc-sync: running documentation drift checks...\n');

// 1. Route coverage in API_CONTRACTS inventory
const routes = walkRoutes(path.join(ROOT, 'app/api')).sort();
const contracts = read('docs/testing/API_CONTRACTS.md');
const missingRoutes = routes.filter((route) => !contracts.includes(`\`${route}\``));
if (missingRoutes.length > 0) {
  fail(`routes missing from API_CONTRACTS.md inventory: ${missingRoutes.join(', ')}`);
} else {
  pass(`${routes.length} app/api routes listed in API_CONTRACTS.md`);
}

// 2. Migration ceiling in key docs
const maxMigration = highestMigrationNumber();
const migrationRefs = [
  ['AGENTS.md', read('AGENTS.md')],
  ['README.md', read('README.md')],
  ['docs/ops/PILOT_DEPLOY_CHECKLIST.md', read('docs/ops/PILOT_DEPLOY_CHECKLIST.md')],
];

for (const [file, content] of migrationRefs) {
  const token = migrationToken(maxMigration);
  if (!content.includes(token) && !content.includes(String(maxMigration))) {
    fail(`${file} does not mention migration ${maxMigration} (${token})`);
  } else {
    pass(`${file} references migration ${maxMigration}`);
  }
}

// 3. Context freshness — CURRENT_STATE mentions P17
const currentState = read('context/CURRENT_STATE.md');
if (!/P17/.test(currentState)) {
  fail('context/CURRENT_STATE.md does not mention P17');
} else {
  pass('context/CURRENT_STATE.md mentions P17');
}

// 4. MVP_SCHEMA links to SCHEMA_CHANGELOG
const mvpSchema = read('docs/database/MVP_SCHEMA.md');
if (!mvpSchema.includes('SCHEMA_CHANGELOG.md')) {
  fail('docs/database/MVP_SCHEMA.md must link to SCHEMA_CHANGELOG.md');
} else {
  pass('MVP_SCHEMA.md links to SCHEMA_CHANGELOG.md');
}

// 5. PAGES mentions inquiry route
const pages = read('docs/product/PAGES.md');
if (!pages.includes('/inquiry/')) {
  fail('docs/product/PAGES.md must mention /inquiry/');
} else {
  pass('PAGES.md mentions /inquiry/');
}

console.log('');
if (failed) {
  process.exit(1);
}

console.log('check-doc-sync: all checks passed.');
process.exit(0);
