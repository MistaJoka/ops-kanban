import { expect, test } from '@playwright/test';

import {
  gotoPipeline,
  openJobPanel,
  saveEstimateLine,
  uniqueJobTitle,
  createJob,
  expectCardInColumn,
  waitForSyncPill,
  moveBoardCardToColumn,
} from './helpers/pipeline';

test.describe('Outbound sync @smoke', () => {
  test('E2E-SYNC-001 @smoke: rapid drags land in target columns before sync clears', async ({
    page,
  }) => {
    const titles = [
      uniqueJobTitle('sync-drag-a'),
      uniqueJobTitle('sync-drag-b'),
      uniqueJobTitle('sync-drag-c'),
    ];

    await gotoPipeline(page);
    for (const title of titles) {
      await createJob(page, title);
    }

    await waitForSyncPill(page, 'Synced');

    for (const title of titles) {
      await moveBoardCardToColumn(page, title, 'Site visit');
    }

    for (const title of titles) {
      await expectCardInColumn(page, title, 'Site visit');
    }

    await waitForSyncPill(page, 'Synced');
  });

  test('E2E-SYNC-002 @smoke: card panel opens without full-page spinner', async ({ page }) => {
    const title = uniqueJobTitle('sync-panel');
    await gotoPipeline(page);
    await createJob(page, title);
    await openJobPanel(page, title);

    await expect(page.getByRole('dialog', { name: 'Job detail panel' })).toBeVisible();
    await expect(page.getByRole('textbox').first()).toHaveValue(title);
  });

  test('E2E-SYNC-003 @smoke: save estimate updates tab without full reload', async ({ page }) => {
    const title = uniqueJobTitle('sync-estimate');
    await gotoPipeline(page);
    await createJob(page, title);
    await openJobPanel(page, title);
    await saveEstimateLine(page, 'Mulch bed refresh', '350');

    const panel = page.getByRole('dialog', { name: 'Job detail panel' });
    await expect(panel.getByText('Preview total')).toBeVisible({ timeout: 15_000 });
    await expect(panel.getByText('$350.00').first()).toBeVisible({ timeout: 15_000 });
  });
});
