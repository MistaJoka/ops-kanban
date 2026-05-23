import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import { createJob, gotoPipeline, openJobPanel, uniqueJobTitle } from './helpers/pipeline';

test.describe('Accessibility @a11y', () => {
  test('A11Y-001: pipeline has zero critical axe violations', async ({ page }) => {
    await gotoPipeline(page);

    const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();

    const critical = results.violations.filter((violation) => violation.impact === 'critical');
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });

  test('A11Y-002: card panel has zero critical axe violations', async ({ page }) => {
    const title = uniqueJobTitle('a11y panel');
    await gotoPipeline(page);
    await createJob(page, title);
    await openJobPanel(page, title);

    const results = await new AxeBuilder({ page })
      .include('[aria-label="Job detail panel"]')
      .disableRules(['color-contrast'])
      .analyze();

    const critical = results.violations.filter((violation) => violation.impact === 'critical');
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });

  test('A11Y-004: keyboard-only create job via column add button', async ({ page }) => {
    const title = uniqueJobTitle('keyboard create');
    await gotoPipeline(page);

    page.once('dialog', async (dialog) => {
      await dialog.accept(title);
    });

    await page.getByRole('button', { name: 'Add job to New inquiry' }).focus();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('article').filter({ hasText: title })).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe('UAT coverage @uat', () => {
  test('UAT-08: filter, search, and help navigation', async ({ page }) => {
    const title = uniqueJobTitle('UAT search');
    await gotoPipeline(page);
    await createJob(page, title);

    await page.getByLabel('Search jobs').fill('UAT search');
    await expect(page.getByRole('article').filter({ hasText: title })).toBeVisible();

    await page.getByLabel('Filter jobs').selectOption('scheduled');
    await expect(page.getByRole('article').filter({ hasText: title })).toHaveCount(0);

    await page.getByLabel('Filter jobs').selectOption('all');
    await page.getByRole('link', { name: 'Help & guides' }).click();
    await expect(page).toHaveURL(/\/support\/help$/);
  });

  test('UAT-09 @mobile: card panel usable at 390px width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const title = uniqueJobTitle('mobile card');
    await gotoPipeline(page);
    await createJob(page, title);
    await openJobPanel(page, title);

    const panel = page.getByRole('dialog', { name: 'Job detail panel' });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Overview', exact: true })).toBeVisible();
    await expect(panel.getByRole('textbox').first()).toHaveValue(title);

    const box = await panel.boundingBox();
    expect(box?.width ?? 0).toBeLessThanOrEqual(390);
  });

  test('UAT-06: AI move rejection leaves card unchanged', async ({ page }) => {
    const title = uniqueJobTitle('AI reject');
    await gotoPipeline(page);
    await createJob(page, title);
    await openJobPanel(page, title);

    await page
      .getByPlaceholder('Ask, analyze, or act on your pipeline…')
      .fill('move to site_visit');
    await page.getByRole('button', { name: 'Run' }).click();

    await expect(page.getByRole('heading', { name: 'Approve AI action' })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: 'Reject' }).click();
    await expect(page.getByText(/Action rejected/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/inquiry ·/i)).toBeVisible();
  });
});
