// apps/web/tests/pages/blueprint.page.ts
import { Page, expect } from '@playwright/test';

export class BlueprintPage {
  constructor(public readonly page: Page) {}

  // Actions
  get addSeedButton() {
    return this.page.getByTestId('add-seed-button');
  }

  get addPotButton() {
    return this.page.getByTestId('add-pot-button');
  }

  get addRepaymentButton() {
    return this.page.getByTestId('add-repayment-button');
  }

  // Seed Modal
  get seedNameInput() {
    return this.page.getByTestId('seed-name-input');
  }

  get seedAmountInput() {
    return this.page.getByTestId('seed-amount-input');
  }

  get seedCategorySelect() {
    return this.page.getByTestId('seed-category-select');
  }

  get seedSourceSelect() {
    return this.page.getByTestId('seed-source-select');
  }

  get seedRecurringCheckbox() {
    return this.page.getByTestId('seed-recurring-checkbox');
  }

  get submitSeedButton() {
    return this.page.getByTestId('submit-seed-form');
  }

  // Seed List
  seedCard(seedName: string) {
    return this.page.getByTestId(`seed-card-${seedName.toLowerCase().replace(/\s+/g, '-')}`);
  }

  seedEditButton(seedName: string) {
    return this.page.getByTestId(`edit-seed-${seedName.toLowerCase().replace(/\s+/g, '-')}`);
  }

  seedDeleteButton(seedName: string) {
    return this.page.getByTestId(`delete-seed-${seedName.toLowerCase().replace(/\s+/g, '-')}`);
  }

  // Payment tracking (current cycle: checkboxes and progress always visible)
  get ritualProgressBar() {
    return this.page.getByRole('progressbar', { name: /bills paid/i });
  }

  get ritualCelebrationClose() {
    return this.page.getByTestId('ritual-celebration-close');
  }

  get ritualCelebrationDashboard() {
    return this.page.getByTestId('ritual-celebration-dashboard');
  }

  seedPaidCheckbox(seedName: string) {
    const slug = seedName.toLowerCase().replace(/\s+/g, '-');
    return this.page.getByTestId(`seed-paid-${slug}`);
  }

  seedPaidMeCheckbox(seedName: string) {
    const slug = seedName.toLowerCase().replace(/\s+/g, '-');
    return this.page.getByTestId(`seed-paid-me-${slug}`);
  }

  seedPaidPartnerCheckbox(seedName: string) {
    const slug = seedName.toLowerCase().replace(/\s+/g, '-');
    return this.page.getByTestId(`seed-paid-partner-${slug}`);
  }

  async markSeedPaid(seedName: string) {
    // Use click() not check(): checkbox is controlled by server state; after
    // server action + router.refresh() the checkbox is replaced by PAID badge.
    await this.seedPaidCheckbox(seedName).click({ noWaitAfter: true });
  }

  async unmarkSeedPaid(seedName: string) {
    await this.seedPaidCheckbox(seedName).click({ noWaitAfter: true });
  }

  async expectRitualProgress(paid: number, total: number) {
    await expect(
      this.page.getByText(`${paid} of ${total} bills paid`)
    ).toBeVisible();
  }

  // Actions
  async goto() {
    await this.page.goto('/dashboard/blueprint');
    if (this.page.url().includes('/login')) {
      throw new Error('Session lost: redirected to login instead of blueprint');
    }
    await this.page.waitForURL(/\/dashboard\/blueprint/, { timeout: 15_000 });
    // When cycle is locked, Add buttons are hidden; wait for either editable state or Unlock button
    const addOrEmpty = this.page.getByTestId('add-seed-button').or(this.page.getByTestId('blueprint-empty-state'));
    const unlockBtn = this.page.getByRole('button', { name: /Unlock/i });
    const editableOrLocked = addOrEmpty.or(unlockBtn);
    await expect(editableOrLocked.first()).toBeVisible({ timeout: 15_000 });
    // If locked, unlock so tests can add seeds
    if (await unlockBtn.isVisible()) {
      await unlockBtn.click();
      await expect(addOrEmpty.first()).toBeVisible({ timeout: 15_000 });
    }
  }

  async addSeed(params: {
    name: string;
    amount: number;
    category: string;
    source: string;
    recurring: boolean;
  }) {
    await this.addSeedButton.click();

    await expect(this.seedNameInput).toBeVisible();
    await this.seedNameInput.fill(params.name);
    await this.seedAmountInput.fill(params.amount.toString());
    // Category is set by which section opened the dialog (add-seed-button = Needs); no need to select
    // Payment source is only shown for couple households; skip when not visible
    const sourceLabel =
      params.source === 'me'
        ? 'Me'
        : params.source === 'partner'
          ? 'Partner'
          : 'Joint';
    const sourceRadio = this.page.getByRole('radio', { name: sourceLabel });
    if (await sourceRadio.isVisible()) {
      await sourceRadio.click();
    }

    if (params.recurring) {
      await this.seedRecurringCheckbox.check();
    }

    await this.submitSeedButton.click();

    // Wait for dialog to close (onSuccess called = create succeeded)
    await expect(this.seedNameInput).not.toBeVisible({ timeout: 15000 }).catch(async () => {
      const errEl = this.page.getByTestId('seed-dialog-error');
      if (await errEl.isVisible()) {
        const msg = await errEl.textContent();
        throw new Error(`Seed create failed: ${msg ?? 'unknown'}`);
      }
      throw new Error('Seed dialog did not close within 15s');
    });
    // Force full page load so we get fresh server data (router.refresh() can be unreliable in CI)
    await this.page.goto('/dashboard/blueprint');
    await this.page.waitForURL(/\/dashboard\/blueprint/, { timeout: 15_000 });
    // Use .first() because the same seed name can appear in multiple categories or cycles (strict mode).
    // Allow 20s for CI where the new seed can take a moment to appear after reload.
    await expect(this.seedCard(params.name).first()).toBeVisible({ timeout: 20_000 });
  }

  async expectSeedInList(seedName: string, amount: number) {
    const card = this.seedCard(seedName).first();
    await expect(card).toBeVisible();
    await expect(card).toContainText(seedName);
    await expect(card).toContainText(`£${amount}`, { timeout: 15_000 });
  }

  async deleteSeed(seedName: string) {
    const countBefore = await this.seedCard(seedName).count();
    await this.seedDeleteButton(seedName).first().click();

    // Confirm deletion in modal
    await this.page.getByTestId('confirm-delete-button').click();

    // Wait for one fewer seed card (same name can appear in multiple categories/cycles)
    await expect(this.seedCard(seedName)).toHaveCount(countBefore - 1, {
      timeout: 10_000,
    });
  }
}
