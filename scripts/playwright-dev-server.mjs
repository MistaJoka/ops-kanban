#!/usr/bin/env node
/**
 * Playwright webServer entry: start dev with a clean .next when cache is poisoned.
 */
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkCssHealth, hasProductionBuildCache } from './check-css-health.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = process.argv[2] ?? process.env.PLAYWRIGHT_PORT ?? '3000';
const baseUrl = `http://localhost:${port}`;

function shouldCleanCache() {
  if (process.env.PLAYWRIGHT_REUSE_DIRTY === '1') {
    return false;
  }

  return Boolean(
    process.env.CI ||
    process.env.PLAYWRIGHT_FRESH_SERVER === '1' ||
    hasProductionBuildCache(path.join(projectRoot, '.next')),
  );
}

async function waitForCssHealth(timeoutMs = 120_000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const result = await checkCssHealth({ baseUrl, pagePath: '/support/help' });
    if (result.ok) {
      console.log(`Playwright dev server ready — ${result.cssUrl}`);
      return;
    }

    if (result.code !== 'SERVER_UNREACHABLE' && result.code !== 'PAGE_ERROR') {
      throw new Error(`${result.code}: ${result.message}\n${result.detail ?? ''}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  throw new Error(`Timed out waiting for CSS health at ${baseUrl}`);
}

if (shouldCleanCache()) {
  console.log('Removing .next before Playwright dev server (fresh or de-poisoned cache)…');
  rmSync(path.join(projectRoot, '.next'), { recursive: true, force: true });
  rmSync(path.join(projectRoot, 'node_modules', '.cache'), { recursive: true, force: true });
}

const child = spawn('npx', ['next', 'dev', '--port', port], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: process.env,
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  child.kill(signal);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

waitForCssHealth().catch((error) => {
  console.error(error.message);
  shutdown('SIGTERM');
  process.exit(1);
});
