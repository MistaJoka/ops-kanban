import { expect, test } from '@playwright/test';

test.describe('CSS health @smoke', () => {
  test('CSS-001 @smoke: app shell serves compiled Field ledger styles', async ({ page }) => {
    const stylesheetResponses: { url: string; status: number }[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (/\/_next\/static\/css\/.*\.css(\?|$)/.test(url)) {
        stylesheetResponses.push({ url, status: response.status() });
      }
    });

    await page.goto('/support/help');
    await expect(page.getByRole('heading', { name: 'Help & guides' })).toBeVisible();

    const styles = await page.evaluate(() => {
      const body = document.body;
      const computed = getComputedStyle(body);
      return {
        backgroundColor: computed.backgroundColor,
        loadedSheets: [...document.styleSheets].filter((sheet) => {
          try {
            return sheet.cssRules.length > 0;
          } catch {
            return false;
          }
        }).length,
      };
    });

    expect(styles.loadedSheets).toBeGreaterThan(0);
    expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');

    const failedStylesheets = stylesheetResponses.filter((entry) => entry.status >= 400);
    expect(failedStylesheets, JSON.stringify(failedStylesheets, null, 2)).toEqual([]);
  });

  test('CSS-002 @smoke: pipeline board surface serves topo background', async ({ page }) => {
    const stylesheetResponses: { url: string; status: number }[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (/\/_next\/static\/css\/.*\.css(\?|$)/.test(url)) {
        stylesheetResponses.push({ url, status: response.status() });
      }
    });

    await page.goto('/pipeline');
    await expect(page.getByRole('heading', { name: 'Job Pipeline' })).toBeVisible();

    const boardStyles = await page.evaluate(() => {
      const surface = document.querySelector('.ops-board-surface');
      if (!(surface instanceof HTMLElement)) {
        return null;
      }

      const computed = getComputedStyle(surface);
      return {
        backgroundColor: computed.backgroundColor,
        backgroundImage: computed.backgroundImage,
      };
    });

    expect(boardStyles).not.toBeNull();
    expect(boardStyles?.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(boardStyles?.backgroundImage).toContain('topo-pattern.svg');

    const failedStylesheets = stylesheetResponses.filter((entry) => entry.status >= 400);
    expect(failedStylesheets, JSON.stringify(failedStylesheets, null, 2)).toEqual([]);
  });
});
