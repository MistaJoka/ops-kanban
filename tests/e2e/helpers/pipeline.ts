import { expect, type Page } from '@playwright/test';

export function uniqueJobTitle(label: string): string {
  return `E2E ${label} ${Date.now()}`;
}

function columnStatusPattern(columnName: string): RegExp {
  return new RegExp(`${columnName.toLowerCase()} ·`, 'i');
}

export async function gotoPipeline(page: Page) {
  await page.goto('/pipeline');
  await expect(page.getByRole('heading', { name: 'Job Pipeline' })).toBeVisible();
}

export async function createJob(page: Page, title: string) {
  page.once('dialog', async (dialog) => {
    await dialog.accept(title);
  });

  await page.getByRole('button', { name: '+ New job' }).click();
  await expect(page.getByRole('article').filter({ hasText: title })).toBeVisible({ timeout: 15_000 });
}

export async function openJobPanel(page: Page, title: string) {
  await page.getByRole('article').filter({ hasText: title }).click();
  const panel = page.getByRole('dialog', { name: 'Job detail panel' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('textbox').first()).toHaveValue(title);
}

export async function closeJobPanel(page: Page) {
  await page.getByRole('button', { name: 'Close panel' }).click();
  await expect(page.getByRole('dialog', { name: 'Job detail panel' })).toBeHidden();
}

export async function expectCardColumn(page: Page, columnName: string) {
  const panel = page.getByRole('dialog', { name: 'Job detail panel' });
  await expect(panel.getByText(columnStatusPattern(columnName))).toBeVisible({ timeout: 15_000 });
}

export async function selectCardColumn(page: Page, columnName: string) {
  const panel = page.getByRole('dialog', { name: 'Job detail panel' });
  await panel.locator('header select').first().selectOption({ label: columnName });
}

export function moveModal(page: Page) {
  return page.locator('div.fixed.inset-0').filter({
    has: page.getByRole('heading', {
      name: /Schedule required|Reason required|Move blocked/,
    }),
  });
}

export async function handleMovePrompts(page: Page, reason?: string) {
  const modal = moveModal(page);
  const scheduleModal = modal.getByRole('heading', { name: 'Schedule required' });
  if (await scheduleModal.isVisible({ timeout: 2000 }).catch(() => false)) {
    const value = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16);
    await modal.locator('input[type="datetime-local"]').fill(value);
    await modal.getByRole('button', { name: 'Continue' }).click();
    return 'schedule';
  }

  const reasonModal = modal.getByRole('heading', { name: 'Reason required' });
  if (await reasonModal.isVisible({ timeout: 1000 }).catch(() => false)) {
    await modal.locator('textarea').fill(reason ?? 'E2E pipeline skip');
    await modal.getByRole('button', { name: 'Continue' }).click();
    return 'reason';
  }

  const blockedModal = modal.getByRole('heading', { name: 'Move blocked' });
  if (await blockedModal.isVisible({ timeout: 1000 }).catch(() => false)) {
    return 'blocked';
  }

  return null;
}

export async function moveCardViaPanel(page: Page, columnName: string, options?: { reason?: string }) {
  const panel = page.getByRole('dialog', { name: 'Job detail panel' });
  await selectCardColumn(page, columnName);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const prompt = await handleMovePrompts(page, options?.reason);
    if (prompt === 'blocked') {
      return false;
    }
    if (!prompt) {
      break;
    }
    await page.waitForTimeout(300);
  }

  await expect(panel.getByText(columnStatusPattern(columnName))).toBeVisible({ timeout: 15_000 });
  return true;
}

export async function advanceToColumn(
  page: Page,
  columnName: string,
  options?: { reason?: string },
): Promise<boolean> {
  return moveCardViaPanel(page, columnName, options);
}

export async function expectMoveBlocked(page: Page, messagePattern: RegExp) {
  const modal = moveModal(page);
  await expect(modal.getByRole('heading', { name: 'Move blocked' })).toBeVisible({ timeout: 10_000 });
  await expect(modal.getByText(messagePattern)).toBeVisible();
}

export async function openCardTab(page: Page, tabName: string) {
  const panel = page.getByRole('dialog', { name: 'Job detail panel' });
  await panel.getByRole('button', { name: tabName, exact: true }).click();
}

export async function saveProperty(
  page: Page,
  data: { name: string; address: string },
) {
  await openCardTab(page, 'Property');
  const panel = page.getByRole('dialog', { name: 'Job detail panel' });
  await panel.locator('input[name="name"]').fill(data.name);
  await panel.locator('input[name="address"]').fill(data.address);
  await panel.getByRole('button', { name: 'Save property' }).click();
  await expect(panel.getByText(data.address)).toBeVisible({ timeout: 10_000 });
}

export async function saveEstimateLine(page: Page, description: string, unitPrice: string) {
  await openCardTab(page, 'Estimate');
  const panel = page.getByRole('dialog', { name: 'Job detail panel' });
  await panel.getByPlaceholder('Description').first().fill(description);
  await panel.getByLabel('Quantity').first().fill('1');
  await panel.getByLabel('Unit price').first().fill(unitPrice);

  const saveResponse = page.waitForResponse(
    (response) => response.url().includes('/quotes') && response.request().method() === 'POST',
  );

  await Promise.all([
    saveResponse,
    panel.getByRole('button', { name: 'Save estimate' }).click(),
  ]);

  expect((await saveResponse).ok()).toBeTruthy();
}

export async function setScheduleDate(page: Page) {
  await openCardTab(page, 'Schedule');
  const panel = page.getByRole('dialog', { name: 'Job detail panel' });
  const scheduleInput = panel.getByLabel('Scheduled start');
  const localValue = new Date(Date.now() + 172_800_000).toISOString().slice(0, 16);
  await scheduleInput.fill(localValue);

  const patchResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/cards/') && response.request().method() === 'PATCH',
  );
  await scheduleInput.blur();
  const response = await patchResponse;
  expect(response.ok()).toBeTruthy();
}

export async function createInvoiceDraft(page: Page) {
  await openCardTab(page, 'Money');
  const panel = page.getByRole('dialog', { name: 'Job detail panel' });
  await panel.getByRole('button', { name: 'Create invoice draft' }).click();
  await expect(panel.getByText('Balance due')).toBeVisible({ timeout: 10_000 });
}

export async function markInvoicePaid(page: Page) {
  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });

  await openCardTab(page, 'Money');
  const panel = page.getByRole('dialog', { name: 'Job detail panel' });
  await panel.getByRole('button', { name: 'Mark paid & archive' }).click();
  await expect(panel.getByText('Paid — job moved to archived.')).toBeVisible({ timeout: 15_000 });
}
