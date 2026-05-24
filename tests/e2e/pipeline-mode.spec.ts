import { expect, test } from '@playwright/test';

import {
  enableCompactPipelineMode,
  enableFullPipelineMode,
  gotoPipeline,
} from './helpers/pipeline';

import { PIPELINE_GROUP_LABELS } from '@/lib/landscaping-full-pipeline';

const FULL_ONLY_STATE_KEYS = ['qualified', 'scheduling', 'invoice_prep', 'retention'] as const;

test.describe('Suite R1 — Full pipeline mode @regression', () => {
  test.afterEach(async ({ page }) => {
    await enableCompactPipelineMode(page);
  });

  test('E2E-PIPE-001 @regression: toggle full shows 19-col board in 4 groups', async ({ page }) => {
    await enableFullPipelineMode(page);

    const groupNav = page.getByRole('navigation', { name: 'Pipeline groups' });
    await expect(groupNav).toBeVisible();

    for (const label of Object.values(PIPELINE_GROUP_LABELS)) {
      await expect(groupNav.getByRole('button', { name: label, exact: true })).toBeVisible();
    }

    const boardColumns = page.locator('.ops-board-surface .ops-column');
    await expect(boardColumns).toHaveCount(18);

    for (const stateKey of FULL_ONLY_STATE_KEYS) {
      await expect(
        boardColumns.filter({ has: page.getByText(stateKey.replace(/_/g, ' '), { exact: true }) }),
      ).toHaveCount(1);
    }

    await expect(page.getByRole('button', { name: 'Compact' })).toBeVisible();
  });

  test('E2E-PIPE-001b @regression: compact mode hides full-only columns', async ({ page }) => {
    await gotoPipeline(page);
    await enableCompactPipelineMode(page);

    await expect(page.getByRole('navigation', { name: 'Pipeline groups' })).toHaveCount(0);
    await expect(page.locator('.ops-board-surface .ops-column')).toHaveCount(8);
    await expect(page.getByRole('button', { name: 'Full (19)' })).toBeVisible();
  });
});
