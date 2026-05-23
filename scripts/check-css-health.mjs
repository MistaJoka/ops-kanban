#!/usr/bin/env node
/**
 * Verifies that HTML references a stylesheet that actually loads.
 * Fails fast when dev cache is poisoned (common after `npm run build` + `next dev`).
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULT_BASE_URL = process.env.CHECK_CSS_BASE_URL ?? 'http://localhost:3000';
const DEFAULT_PATH = process.env.CHECK_CSS_PATH ?? '/support/help';
const MIN_CSS_BYTES = Number(process.env.CHECK_CSS_MIN_BYTES ?? 10_000);
const MARKER = '--surface-board';

export function hasProductionBuildCache(nextDir = path.join(projectRoot, '.next')) {
  return existsSync(path.join(nextDir, 'BUILD_ID'));
}

export async function checkCssHealth(options = {}) {
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  const pagePath = options.pagePath ?? DEFAULT_PATH;
  const minBytes = options.minBytes ?? MIN_CSS_BYTES;
  const marker = options.marker ?? MARKER;

  const pageUrl = `${baseUrl}${pagePath.startsWith('/') ? pagePath : `/${pagePath}`}`;

  let pageResponse;
  try {
    pageResponse = await fetch(pageUrl, { redirect: 'follow' });
  } catch (error) {
    return {
      ok: false,
      code: 'SERVER_UNREACHABLE',
      message: `Could not reach ${pageUrl}. Start the app or run npm run dev:clean.`,
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  if (!pageResponse.ok) {
    return {
      ok: false,
      code: 'PAGE_ERROR',
      message: `${pagePath} returned HTTP ${pageResponse.status}. Fix server errors before UI work.`,
      detail: await pageResponse.text().then((text) => text.slice(0, 200)),
    };
  }

  const html = await pageResponse.text();
  const cssMatch = html.match(/href="(\/_next\/static\/css\/[^"]+\.css[^"]*)"/);

  if (!cssMatch) {
    return {
      ok: false,
      code: 'CSS_LINK_MISSING',
      message: `No stylesheet link found in ${pagePath} HTML.`,
      detail: 'Next did not emit a CSS chunk link — dev server may be mid-compile or crashed.',
    };
  }

  const cssPath = cssMatch[1].split('?')[0];
  const cssUrl = `${baseUrl}${cssPath}${cssMatch[1].includes('?') ? `?${cssMatch[1].split('?')[1]}` : ''}`;

  let cssResponse;
  try {
    cssResponse = await fetch(cssUrl);
  } catch (error) {
    return {
      ok: false,
      code: 'CSS_FETCH_FAILED',
      message: `Failed to fetch stylesheet ${cssPath}.`,
      detail: error instanceof Error ? error.message : String(error),
    };
  }

  if (!cssResponse.ok) {
    const prodCache = hasProductionBuildCache();
    return {
      ok: false,
      code: 'CSS_NOT_FOUND',
      message: `Stylesheet ${cssPath} returned HTTP ${cssResponse.status}. UI will look unstyled.`,
      detail: prodCache
        ? 'Detected production BUILD_ID in .next while dev is running. Run: npm run dev:clean'
        : 'Stale dev server or corrupted .next cache. Run: npm run dev:clean',
      cssUrl,
      prodCache,
    };
  }

  const cssText = await cssResponse.text();

  if (cssText.length < minBytes) {
    return {
      ok: false,
      code: 'CSS_TOO_SMALL',
      message: `Stylesheet is only ${cssText.length} bytes (expected >= ${minBytes}).`,
      detail: 'Tailwind/globals.css likely did not compile.',
      cssUrl,
    };
  }

  if (!cssText.includes(marker)) {
    return {
      ok: false,
      code: 'CSS_MARKER_MISSING',
      message: `Stylesheet loaded but missing "${marker}" rules.`,
      detail: 'globals.css may be stale or the wrong CSS bundle is served.',
      cssUrl,
    };
  }

  return {
    ok: true,
    pageUrl,
    cssUrl,
    cssBytes: cssText.length,
    prodCache: hasProductionBuildCache(),
  };
}

function printResult(result) {
  if (result.ok) {
    console.log(`OK: CSS health (${result.cssBytes} bytes) — ${result.cssUrl}`);
    if (result.prodCache) {
      console.warn(
        'WARN: .next/BUILD_ID exists (production build). Stop dev and run npm run dev:clean before the next session.',
      );
    }
    return;
  }

  console.error(`FAIL [${result.code}]: ${result.message}`);
  if (result.detail) {
    console.error(result.detail);
  }
  console.error('\nRecovery: npm run dev:clean');
  console.error(
    'Avoid: npm run build while `next dev` is running; reusing a stale port-3000 process.',
  );
}

async function main() {
  const result = await checkCssHealth();
  printResult(result);
  process.exit(result.ok ? 0 : 1);
}

if (process.argv[1]?.endsWith('check-css-health.mjs')) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
