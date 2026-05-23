import { expect, test } from '@playwright/test';

import { gotoPipeline } from './helpers/pipeline';

test.describe('Workspace UI @smoke', () => {
  test('E2E-WORKSPACE-001 @smoke: collapsed AI dock visible on pipeline', async ({ page }) => {
    await gotoPipeline(page);

    const dock = page.getByRole('region', { name: 'Ops copilot' });
    await expect(dock).toBeVisible();
    await expect(dock).toHaveAttribute('aria-expanded', 'false');
    await expect(dock.getByRole('button', { name: 'Expand Ops copilot' })).toBeVisible();
    await expect(dock.getByText(/Ask about today/i)).toBeVisible();
  });

  test('E2E-WORKSPACE-002 @smoke: expand dock shows Ask mode chip', async ({ page }) => {
    await gotoPipeline(page);

    const dock = page.locator('.ops-ai-dock');
    await dock.getByRole('button', { name: 'Expand Ops copilot' }).click();

    await expect(dock).toHaveAttribute('aria-expanded', 'true');
    await expect(dock.getByRole('button', { name: 'Ask', exact: true })).toBeVisible();
  });

  test('E2E-WORKSPACE-006 @smoke: toolbar AI button opens copilot popup', async ({ page }) => {
    await gotoPipeline(page);

    await page.getByRole('button', { name: 'Open AI copilot' }).click();

    const copilot = page.getByRole('dialog', { name: 'Ops copilot' });
    await expect(copilot).toBeVisible();
    await expect(copilot.getByRole('button', { name: 'Ask', exact: true })).toBeVisible();
    await expect(copilot.getByRole('textbox', { name: 'AI command' })).toBeFocused();
  });

  test('E2E-WORKSPACE-003 @smoke: full pipeline mode shows group jump chips', async ({ page }) => {
    await gotoPipeline(page);

    const fullModeToggle = page.getByRole('button', { name: 'Full (19)' });
    if (await fullModeToggle.isVisible()) {
      await fullModeToggle.click();
    }

    await expect(page.getByRole('navigation', { name: 'Pipeline groups' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Intake & sales' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Production' })).toBeVisible();
  });

  test('E2E-WORKSPACE-004 @smoke: ? opens keyboard shortcuts dialog', async ({ page }) => {
    await gotoPipeline(page);

    await page.keyboard.press('?');
    const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Toggle sidebar')).toBeVisible();
  });

  test('E2E-WORKSPACE-005 @smoke: / focuses pipeline search input', async ({ page }) => {
    await gotoPipeline(page);

    await page.keyboard.press('/');
    const search = page.getByRole('searchbox', { name: 'Search jobs' });
    await expect(search).toBeFocused();
  });
});
