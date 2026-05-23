#!/usr/bin/env node
/**
 * AI slop structural health checks (Layer 3–4).
 * See docs/testing/AI_SLOP_DETECTION.md
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FAIL_LINE_COUNT = 600;
const TARGET_LINE_COUNT = 500;

/** Grandfathered mega-files — shrink as splits land (TASK-P14-006). */
const ALLOWLIST = new Set([
  'components/pipeline/kanban-board/useKanbanBoardController.ts',
  'components/pipeline/useBoardState.ts',
  'lib/domain/ai/toolCalls.ts',
]);

const SCAN_DIRS = ['app', 'components', 'lib'];
const EXT = new Set(['.ts', '.tsx']);

let failed = false;
const warnings = [];

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.next') continue;
      walk(full, out);
    } else if (EXT.has(path.extname(name))) {
      out.push(full);
    }
  }
  return out;
}

function countLines(filePath) {
  return fs.readFileSync(filePath, 'utf8').split('\n').length;
}

console.log('check-slop-health: scanning TS/TSX file sizes...');
const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
const oversized = [];

for (const file of files) {
  const r = rel(file);
  const lines = countLines(file);
  if (lines > FAIL_LINE_COUNT && !ALLOWLIST.has(r)) {
    oversized.push({ file: r, lines });
  } else if (lines > TARGET_LINE_COUNT && !ALLOWLIST.has(r)) {
    warnings.push(`${r}: ${lines} lines (target ≤${TARGET_LINE_COUNT})`);
  }
}

if (oversized.length) {
  failed = true;
  console.error(`FAIL: files exceed ${FAIL_LINE_COUNT} lines (not allowlisted):`);
  for (const { file, lines } of oversized.sort((a, b) => b.lines - a.lines)) {
    console.error(`  ${file}: ${lines}`);
  }
}

console.log('check-slop-health: domain boundary (no Supabase in UI)...');
const uiDirs = ['app', 'components'];
for (const dir of uiDirs) {
  const target = path.join(ROOT, dir);
  if (!fs.existsSync(target)) continue;
  try {
    const hits = execSync(
      `rg -l "@supabase/supabase-js" "${target}" --glob "*.ts" --glob "*.tsx" 2>/dev/null || true`,
      { encoding: 'utf8', cwd: ROOT },
    )
      .trim()
      .split('\n')
      .filter(Boolean);
    if (hits.length) {
      failed = true;
      console.error(`FAIL: Supabase client import in ${dir}/ (use /api routes):`);
      hits.forEach((h) => console.error(`  ${h}`));
    }
  } catch {
    /* rg missing — skip */
  }
}

console.log('check-slop-health: allowlist (must shrink over time)...');
console.log(`  Allowlisted (${ALLOWLIST.size}): ${[...ALLOWLIST].join(', ') || '(none)'}`);

if (warnings.length) {
  console.warn('WARN: approaching line budget:');
  warnings.slice(0, 10).forEach((w) => console.warn(`  ${w}`));
  if (warnings.length > 10) console.warn(`  ... and ${warnings.length - 10} more`);
}

if (failed) {
  console.error('\ncheck-slop-health: FAILED');
  process.exit(1);
}

console.log('check-slop-health: OK');
