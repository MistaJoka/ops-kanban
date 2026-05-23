import { expect, test, type Page } from '@playwright/test';

import {
  boardCardByTitle,
  createJob,
  gotoPipeline,
  openJobPanel,
  uniqueJobTitle,
} from './helpers/pipeline';

const SCREENSHOT_OPTS = {
  maxDiffPixelRatio: 0.03,
  animations: 'disabled' as const,
};

async function useLightTheme(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('opsboard-theme', 'light');
    document.documentElement.classList.remove('dark');
  });
}

async function useDarkTheme(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('opsboard-theme', 'dark');
    document.documentElement.classList.add('dark');
  });
}

test.describe('P15 visual regression @visual', () => {
  test('VIS-P15-001: empty pipeline', async ({ page }) => {
    await useLightTheme(page);
    await gotoPipeline(page);

    const emptyBoard = page.getByText('Your pipeline is ready');
    if (!(await emptyBoard.isVisible())) {
      test.skip(true, 'Board has jobs — empty state not visible');
    }

    await expect(page.locator('.ops-pipeline-root')).toHaveScreenshot('empty-pipeline.png', {
      ...SCREENSHOT_OPTS,
    });
  });

  test('VIS-P15-002: populated pipeline', async ({ page }) => {
    await useLightTheme(page);
    await gotoPipeline(page);

    const title = uniqueJobTitle('visual');
    await createJob(page, title);
    await expect(boardCardByTitle(page, title)).toBeVisible();

    await expect(page.locator('.ops-board-scroll-wrap')).toHaveScreenshot(
      'populated-pipeline.png',
      {
        ...SCREENSHOT_OPTS,
      },
    );
  });

  test('VIS-P15-003: dragging card', async ({ page }) => {
    await useLightTheme(page);
    await gotoPipeline(page);

    const title = uniqueJobTitle('drag-visual');
    await createJob(page, title);

    const card = boardCardByTitle(page, title);
    const cardBox = await card.boundingBox();
    if (!cardBox) {
      throw new Error('Could not resolve card bounds for drag screenshot');
    }

    const startX = cardBox.x + cardBox.width / 2;
    const startY = cardBox.y + cardBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 40, startY - 20, { steps: 8 });

    await expect(page.locator('.ops-board-scroll-wrap')).toHaveScreenshot('dragging-card.png', {
      ...SCREENSHOT_OPTS,
    });

    await page.mouse.up();
  });

  test('VIS-P15-004: filtered no-results', async ({ page }) => {
    await useLightTheme(page);
    await gotoPipeline(page);

    await page.getByRole('searchbox', { name: 'Search jobs' }).fill('zzz-no-match-visual-999');
    await expect(page.getByText('No matching jobs')).toBeVisible();

    await expect(page.locator('.ops-pipeline-root')).toHaveScreenshot('filtered-no-results.png', {
      ...SCREENSHOT_OPTS,
    });
  });

  test('VIS-P15-005: card panel', async ({ page }) => {
    await useLightTheme(page);
    await gotoPipeline(page);

    const title = uniqueJobTitle('panel-visual');
    await createJob(page, title);
    await openJobPanel(page, title);

    await expect(page.getByRole('dialog', { name: 'Job detail panel' })).toHaveScreenshot(
      'card-panel.png',
      { ...SCREENSHOT_OPTS },
    );
  });

  test('VIS-P15-006: new job modal', async ({ page }) => {
    await useLightTheme(page);
    await gotoPipeline(page);

    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.getByRole('menuitem', { name: 'New job' }).click();

    const modal = page.getByRole('dialog', { name: 'New job' });
    await expect(modal).toBeVisible();

    await expect(modal).toHaveScreenshot('new-job-modal.png', { ...SCREENSHOT_OPTS });
  });

  test('VIS-P15-007: mobile pipeline', async ({ page }) => {
    await useLightTheme(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoPipeline(page);

    await expect(page.locator('.ops-mobile-stage-nav')).toBeVisible();

    await expect(page.locator('.ops-pipeline-root')).toHaveScreenshot('mobile-pipeline.png', {
      ...SCREENSHOT_OPTS,
    });
  });

  test('VIS-P15-008: dark mode pipeline', async ({ page }) => {
    await useDarkTheme(page);
    await gotoPipeline(page);

    await expect(page.locator('html')).toHaveClass(/dark/);

    await expect(page.locator('.ops-pipeline-root')).toHaveScreenshot('dark-pipeline.png', {
      ...SCREENSHOT_OPTS,
    });
  });
});
