import { expect, test } from '@playwright/test';

import {
  advanceToColumn,
  setScheduleDate,
  createInvoiceDraft,
  createJob,
  expectMoveBlocked,
  expectCardColumn,
  moveCardViaPanel,
  moveModal,
  gotoPipeline,
  markInvoicePaid,
  openJobPanel,
  saveEstimateLine,
  saveProperty,
  selectCardColumn,
  uniqueJobTitle,
} from './helpers/pipeline';

test.describe.configure({ mode: 'serial' });

test.describe('Suite R0 — Wave 0 critical path @wave0', () => {
  test('E2E-BOOT-001 @smoke: auth bypass lands on pipeline with columns', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/pipeline$/);
    await expect(page.getByRole('heading', { name: 'Job Pipeline' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'New inquiry', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Complete', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Archived', exact: true })).toHaveCount(0);
  });

  test('E2E-JOB-001 @smoke: create inquiry card from + button', async ({ page }) => {
    const title = uniqueJobTitle('create');
    await gotoPipeline(page);
    await createJob(page, title);
    await expect(page.getByRole('article').filter({ hasText: title })).toBeVisible();
  });

  test('E2E-JOB-003 @smoke: Property tab saves address on card', async ({ page }) => {
    const title = uniqueJobTitle('property');
    await gotoPipeline(page);
    await createJob(page, title);
    await openJobPanel(page, title);
    await saveProperty(page, { name: 'Rivera', address: '142 Oak Lane' });
    await expect(page.getByRole('dialog', { name: 'Job detail panel' })).toContainText(
      '142 Oak Lane',
    );
  });

  test('E2E-JOB-004 @regression: estimate_sent blocked at $0 then allowed with lines', async ({
    page,
  }) => {
    const title = uniqueJobTitle('estimate-gate');
    await gotoPipeline(page);
    await createJob(page, title);
    await openJobPanel(page, title);

    await advanceToColumn(page, 'Site visit');
    await advanceToColumn(page, 'Estimating');
    await expectCardColumn(page, 'Estimating');

    await selectCardColumn(page, 'Estimate sent');
    await expectMoveBlocked(page, /estimate line items/i);
    await moveModal(page).getByRole('button', { name: 'Cancel' }).click();

    await saveEstimateLine(page, 'Spring cleanup', '425');
    const moved = await moveCardViaPanel(page, 'Estimate sent');
    expect(moved).toBe(true);
  });

  test('E2E-JOB-006 @regression: scheduled without date shows validation modal', async ({
    page,
  }) => {
    const title = uniqueJobTitle('schedule-gate');
    await gotoPipeline(page);
    await createJob(page, title);
    await openJobPanel(page, title);

    await advanceToColumn(page, 'Site visit');
    await advanceToColumn(page, 'Estimating');
    await saveEstimateLine(page, 'Mulch install', '300');
    await advanceToColumn(page, 'Estimate sent');
    await advanceToColumn(page, 'Approved');

    await selectCardColumn(page, 'Scheduled');
    await expect(moveModal(page).getByRole('heading', { name: 'Schedule required' })).toBeVisible({
      timeout: 10_000,
    });
    await moveModal(page).getByRole('button', { name: 'Cancel' }).click();
  });

  test('E2E-JOB-005 @regression: move to scheduled after setting date', async ({ page }) => {
    const title = uniqueJobTitle('schedule-ok');
    await gotoPipeline(page);
    await createJob(page, title);
    await openJobPanel(page, title);

    await advanceToColumn(page, 'Site visit');
    await advanceToColumn(page, 'Estimating');
    await saveEstimateLine(page, 'Bed edging', '180');
    await advanceToColumn(page, 'Estimate sent');
    await advanceToColumn(page, 'Approved');

    await setScheduleDate(page);
    await advanceToColumn(page, 'Scheduled');
    await expectCardColumn(page, 'Scheduled');
  });

  test('E2E-JOB-007 @regression: complete job can create invoice draft', async ({ page }) => {
    const title = uniqueJobTitle('invoice-flow');
    await gotoPipeline(page);
    await createJob(page, title);
    await openJobPanel(page, title);

    await advanceToColumn(page, 'Site visit');
    await advanceToColumn(page, 'Estimating');
    await saveEstimateLine(page, 'Full cleanup', '500');
    await advanceToColumn(page, 'Estimate sent');
    await advanceToColumn(page, 'Approved');
    await setScheduleDate(page);
    await advanceToColumn(page, 'Scheduled');
    await advanceToColumn(page, 'On site');
    await advanceToColumn(page, 'Complete');

    await createInvoiceDraft(page);
    await expect(
      page.getByRole('dialog', { name: 'Job detail panel' }).getByText('$500.00').first(),
    ).toBeVisible();
  });

  test('E2E-MNY-001 @regression: mark paid archives card and hides from default board', async ({
    page,
  }) => {
    const title = uniqueJobTitle('paid-archive');
    await gotoPipeline(page);
    await createJob(page, title);
    await openJobPanel(page, title);

    await advanceToColumn(page, 'Site visit');
    await advanceToColumn(page, 'Estimating');
    await saveEstimateLine(page, 'Paid job service', '275');
    await advanceToColumn(page, 'Estimate sent');
    await advanceToColumn(page, 'Approved');
    await setScheduleDate(page);
    await advanceToColumn(page, 'Scheduled');
    await advanceToColumn(page, 'On site');
    await advanceToColumn(page, 'Complete');

    await createInvoiceDraft(page);
    await markInvoicePaid(page);

    await page.getByRole('button', { name: 'Close panel' }).click();
    await expect(page.getByRole('article').filter({ hasText: title })).toHaveCount(0);

    await page.getByRole('combobox').first().selectOption('archived');
    await expect(page.getByRole('article').filter({ hasText: title })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('E2E-JOB-002 @regression: drag move rolls back on API failure', async ({ page }) => {
    const title = uniqueJobTitle('drag-rollback');
    await gotoPipeline(page);
    await createJob(page, title);

    await page.route('**/api/cards/*/move', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Injected failure' }),
      }),
    );

    const card = page.getByRole('article').filter({ hasText: title });
    const targetColumn = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Site visit', exact: true }) });

    await card.dragTo(targetColumn);
    await expect(page.getByText(/Injected failure|Failed to move/i)).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page
        .locator('section')
        .filter({ has: page.getByRole('heading', { name: 'New inquiry', exact: true }) })
        .getByRole('article')
        .filter({ hasText: title }),
    ).toBeVisible();
  });

  test('E2E-SUP-001 @regression: help page loads inside shell', async ({ page }) => {
    await gotoPipeline(page);
    await page.getByRole('link', { name: 'Help & guides' }).click();
    await expect(page).toHaveURL(/\/support\/help$/);
    await expect(page.getByRole('heading', { name: /Help & guides/i })).toBeVisible();
  });

  test('E2E-DASH-001 @smoke: dashboard page loads summary cards', async ({ page }) => {
    await gotoPipeline(page);
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Scheduled today|Pipeline snapshot/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('E2E-CUST-001 @smoke: customers page loads list shell', async ({ page }) => {
    await gotoPipeline(page);
    await page.getByRole('link', { name: 'Customers' }).click();
    await expect(page).toHaveURL(/\/customers$/);
    await expect(page.getByRole('heading', { name: /Customers/i })).toBeVisible();
    await expect(page.getByPlaceholder('Search customers…')).toBeVisible();
  });
});

test.describe('Suite R0 — AI flows (Phase 5) @wave0', () => {
  test('E2E-AI-001 @smoke: AI summarize card', async ({ page }) => {
    const title = uniqueJobTitle('AI summarize');
    await gotoPipeline(page);
    await createJob(page, title);
    await openJobPanel(page, title);

    const summary = page.getByTestId('card-ai-summary');
    await expect(summary).toBeVisible({ timeout: 15_000 });
    await expect(summary).toContainText(title, { timeout: 15_000 });
  });

  test('E2E-AI-002 @regression: AI move with approval', async ({ page }) => {
    const title = uniqueJobTitle('AI move');
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
    await page.getByRole('button', { name: 'Approve & run' }).click();

    await expectCardColumn(page, 'Site visit');
  });

  test('E2E-AI-003 @regression: blocked destructive AI command', async ({ page }) => {
    await gotoPipeline(page);
    await page.getByPlaceholder('Ask, analyze, or act on your pipeline…').fill('delete all cards');
    await page.getByRole('button', { name: 'Run' }).click();

    await expect(page.getByText(/cannot run destructive or unsafe commands/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
