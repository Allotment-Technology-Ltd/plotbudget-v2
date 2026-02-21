// apps/web/tests/specs/blueprint.spec.ts
import { test, expect } from '@playwright/test';
import { BlueprintPage } from '../pages/blueprint.page';
import { ensureBlueprintReady } from '../utils/db-cleanup';

const BLUEPRINT_USER = 'blueprint@plotbudget.test';

// Serial: share one user/household; uses dedicated user so onboarding resets don't affect these tests
test.describe.serial('Blueprint - Seed Management', () => {
  test.beforeEach(async () => {
    await ensureBlueprintReady(BLUEPRINT_USER);
  });

  test('add a new recurring need seed', async ({ page }) => {
    test.setTimeout(90_000); // addSeed: dialog close + reload + seed card visibility can exceed 30s in CI
    const blueprintPage = new BlueprintPage(page);
    await blueprintPage.goto();

    await blueprintPage.addSeed({
      name: 'Rent',
      amount: 1200,
      category: 'need',
      source: 'me',
      recurring: true,
    });

    // Verify seed appears in list
    await blueprintPage.expectSeedInList('Rent', 1200);
  });

  test('edit existing seed amount', async ({ page }) => {
    test.setTimeout(60_000);
    const blueprintPage = new BlueprintPage(page);
    await blueprintPage.goto();

    // First, create a seed
    await blueprintPage.addSeed({
      name: 'Groceries',
      amount: 300,
      category: 'need',
      source: 'me',
      recurring: true,
    });

    // Then edit it
    await blueprintPage.seedEditButton('Groceries').click();
    await expect(blueprintPage.seedAmountInput).toHaveValue('300');

    await blueprintPage.seedAmountInput.clear();
    await blueprintPage.seedAmountInput.fill('350');
    await blueprintPage.submitSeedButton.click();

    // Wait for edit dialog to close, then reload to get fresh server data (edit uses revalidatePath; reload avoids stale UI in CI)
    await expect(blueprintPage.seedAmountInput).not.toBeVisible({
      timeout: process.env.CI ? 20_000 : 10_000,
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/dashboard\/money\/blueprint/, { timeout: process.env.CI ? 25_000 : 15_000 });

    // Verify updated amount
    await blueprintPage.expectSeedInList('Groceries', 350);
  });

  test('delete seed with confirmation', async ({ page }) => {
    test.setTimeout(60_000); // addSeed + delete can exceed 30s in CI
    const blueprintPage = new BlueprintPage(page);
    await blueprintPage.goto();

    // Create seed
    await blueprintPage.addSeed({
      name: 'Test Seed',
      amount: 100,
      category: 'want',
      source: 'me',
      recurring: false,
    });

    // Delete it (deleteSeed asserts one fewer card with this name)
    await blueprintPage.deleteSeed('Test Seed');
  });

  test('cannot add seed with negative amount', async ({ page }) => {
    const blueprintPage = new BlueprintPage(page);
    await blueprintPage.goto();
    await blueprintPage.addSeedButton.click();
    await expect(blueprintPage.seedNameInput).toBeVisible({ timeout: 15_000 });

    // Amount input strips minus; use 0 to trigger "Amount must be greater than 0"
    await blueprintPage.seedNameInput.fill('Invalid Seed');
    await blueprintPage.seedAmountInput.fill('0');
    await blueprintPage.submitSeedButton.click();

    // Should show validation error
    await expect(page.getByTestId('amount-error-message')).toBeVisible();
  });

  test('solo mode: added seed does not show "Added by" (data still captured for future couple mode)', async ({ page }) => {
    const blueprintPage = new BlueprintPage(page);
    await blueprintPage.goto();

    await blueprintPage.addSeed({
      name: 'Solo Only Bill',
      amount: 99,
      category: 'need',
      source: 'me',
      recurring: false,
    });

    await blueprintPage.expectSeedInList('Solo Only Bill', 99);
    // In solo mode we hide "Added by" in the UI; created_by_owner is still stored
    await expect(page.getByText('Added by', { exact: false })).not.toBeVisible();
  });
});
