#!/usr/bin/env node
import { hasProductionBuildCache } from './check-css-health.mjs';

const strict = process.argv.includes('--strict');

if (!hasProductionBuildCache()) {
  process.exit(0);
}

const message = [
  '',
  '⚠️  .next contains a production build (BUILD_ID).',
  '   Running `next dev` on top of it often breaks CSS (404 layout.css → unstyled UI).',
  '   Fix: npm run dev:clean',
  '   Avoid: npm run build while dev is running; leaving multiple dev servers on :3000.',
  '',
].join('\n');

if (strict) {
  console.error(message);
  process.exit(1);
}

console.warn(message);
