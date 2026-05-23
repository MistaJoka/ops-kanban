import { execSync } from 'node:child_process';

const baseUrl = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export default async function globalSetup() {
  if (process.env.PLAYWRIGHT_SKIP_CSS_CHECK === '1') {
    return;
  }

  try {
    execSync('node scripts/check-css-health.mjs', {
      cwd: process.cwd(),
      env: {
        ...process.env,
        CHECK_CSS_BASE_URL: baseUrl,
        CHECK_CSS_PATH: '/support/help',
      },
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } catch (error) {
    const stdout =
      error && typeof error === 'object' && 'stdout' in error
        ? String((error as { stdout?: string }).stdout ?? '')
        : '';
    const stderr =
      error && typeof error === 'object' && 'stderr' in error
        ? String((error as { stderr?: string }).stderr ?? '')
        : '';

    throw new Error(
      [
        'CSS health check failed before E2E tests.',
        `${stdout}${stderr}`.trim(),
        '',
        'Recovery: npm run dev:clean',
        'If you intentionally reuse a dirty server: PLAYWRIGHT_SKIP_CSS_CHECK=1',
      ].join('\n'),
    );
  }
}
