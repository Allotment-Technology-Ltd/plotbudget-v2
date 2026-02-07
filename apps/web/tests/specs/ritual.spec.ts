// apps/web/tests/specs/ritual.spec.ts
// Payment tracking: current (active) cycle always shows paid checkboxes and progress. No toggle.
import { test, expect } from '@playwright/test';
import { BlueprintPage } from '../pages/blueprint.page';
import { ensureBlueprintReady } from '../utils/db-cleanup';

const RITUAL_USER = 'ritual@plotbudget.test';

test.describe.serial('Blueprint - Payment tracking (current cycle)', () => {
  test.beforeEach(async () => {
    await ensureBlueprintReady(RITUAL_USER);
  });

  test('active cycle shows progress bar and payment checkboxes', async ({
    page,
  }) => {
    const blueprintPage = new BlueprintPage(page);
    await blueprintPage.goto();

    await expect(
      page.getByRole('progressbar', { name: /bills paid/i })
    ).toBeVisible();
  });

  test('mark seed as paid updates progress and shows celebration', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const blueprintPage = new BlueprintPage(page);
    await blueprintPage.goto();

    await blueprintPage.addSeed({
      name: 'Ritual Test Bill',
      amount: 100,
      category: 'need',
      source: 'me',
      recurring: true,
    });

    await expect(blueprintPage.seedPaidCheckbox('Ritual Test Bill')).toBeVisible();
    await blueprintPage.markSeedPaid('Ritual Test Bill');

    await blueprintPage.expectRitualProgress(1, 1);
    // After all bills paid we show "Close cycle" CTA; user must click it to see celebration
    await expect(
      page.getByRole('button', { name: /Close cycle/i })
    ).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /Close cycle/i }).click();
    await expect(
      page.getByText('Ritual Complete!', { exact: false })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('celebration can be dismissed', async ({ page }) => {
    const blueprintPage = new BlueprintPage(page);
    await blueprintPage.goto();

    await blueprintPage.addSeed({
      name: 'Single Bill',
      amount: 50,
      category: 'need',
      source: 'me',
      recurring: false,
    });

    await blueprintPage.markSeedPaid('Single Bill');
    // Close-cycle CTA appears when all paid; click to open celebration
    await expect(
      page.getByRole('button', { name: /Close cycle/i })
    ).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Close cycle/i }).click();

    await expect(blueprintPage.ritualCelebrationClose).toBeVisible({
      timeout: 5000,
    });
    await blueprintPage.ritualCelebrationClose.click();

    await expect(blueprintPage.ritualCelebrationClose).not.toBeVisible();
  });
});
