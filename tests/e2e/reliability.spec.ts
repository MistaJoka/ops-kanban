import { expect, test } from '@playwright/test';

import { createJob, gotoPipeline, uniqueJobTitle } from './helpers/pipeline';

test.describe('Reliability @reliability', () => {
  test('REL-001: board remains usable when refresh fails once', async ({ page }) => {
    await gotoPipeline(page);

    let boardFailures = 0;
    await page.route('**/api/board**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }

      boardFailures += 1;
      if (boardFailures === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Temporary outage', code: 'SERVICE_UNAVAILABLE' }),
        });
        return;
      }

      await route.continue();
    });

    // SSR loads initial board; trigger client refresh (toggle pipeline mode refetches board).
    const modeButton = page.getByRole('button', { name: /Full \(19\)|Compact/ });
    await modeButton.scrollIntoViewIfNeeded();
    await modeButton.click();

    await expect(page.getByRole('heading', { name: 'Job Pipeline' })).toBeVisible();
    await expect(page.locator('.ops-toolbar-error')).toContainText(
      /failed to refresh board|temporary outage/i,
      { timeout: 10_000 },
    );

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Job Pipeline' })).toBeVisible();
  });

  test('REL-003: double-submit new job creates one card', async ({ page }) => {
    const title = uniqueJobTitle('double-submit');
    await gotoPipeline(page);

    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByRole('menuitem', { name: 'New job' }).click();
    const modal = page.getByRole('dialog', { name: 'New job' });
    await expect(modal).toBeVisible();
    await modal.getByLabel('Job title').fill(title);

    const createButton = modal.getByRole('button', { name: 'Create', exact: true });
    await createButton.dblclick();

    await expect(modal).toBeHidden({ timeout: 10_000 });
    await expect(page.locator('.ops-board-card').filter({ hasText: title })).toHaveCount(1, {
      timeout: 15_000,
    });
  });

  test('E2E-RT-001: sync indicator reflects live connection state', async ({ page }) => {
    await gotoPipeline(page);
    await expect(page.locator('.ops-sync-gauge')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.ops-sync-gauge')).toContainText(/Synced|Saving|Updating|Out of sync/i);
  });
});
