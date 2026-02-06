// apps/web/tests/pages/onboarding.page.ts
import { Page, expect } from '@playwright/test';

export class OnboardingPage {
  constructor(public readonly page: Page) {}

  // Step 1: Mode Selection
  get soloModeButton() {
    return this.page.getByTestId('select-mode-solo');
  }

  get coupleModeButton() {
    return this.page.getByTestId('select-mode-couple');
  }

  // Step 2: Income
  get incomeInput() {
    return this.page.getByTestId('income-input');
  }

  // Step 3: Pay Cycle
  get payCycleSelect() {
    return this.page.getByTestId('pay-cycle-type-select');
  }

  get payCycleDateInput() {
    return this.page.getByTestId('pay-cycle-date-input');
  }

  // Step 4: Split Ratio (couple mode only)
  get splitRatioMeInput() {
    return this.page.getByTestId('split-ratio-me-input');
  }

  get splitRatioPartnerInput() {
    return this.page.getByTestId('split-ratio-partner-input');
  }

  // Navigation
  get nextButton() {
    return this.page.getByTestId('onboarding-next-button');
  }

  get backButton() {
    return this.page.getByTestId('onboarding-back-button');
  }

  get createBlueprintButton() {
    return this.page.getByTestId('create-blueprint-button');
  }

  // Actions
  async goto() {
    await this.page.goto('/onboarding');
    await expect(this.soloModeButton).toBeVisible();
  }

  /** Next pay date input (visible when "Every 4 weeks" is selected). Value format: YYYY-MM-DD */
  get anchorDateInput() {
    return this.page.getByLabel('Next Pay Date');
  }

  async completeSoloOnboarding(income: number, payCycleDate: number) {
    // Single form: mode, income, pay cycle (radio), then submit
    await this.soloModeButton.click();
    await expect(this.incomeInput).toBeVisible();
    await this.incomeInput.fill(income.toString());
    await expect(this.payCycleSelect).toBeVisible();
    await this.page.getByRole('radio', { name: 'Specific date (e.g., 25th)' }).click();
    await this.payCycleDateInput.click();
    const dayOption = this.page.getByRole('option', { name: payCycleDate.toString() });
    await expect(dayOption).toBeVisible({ timeout: 5000 });
    await dayOption.click();
    await expect(this.createBlueprintButton).toBeVisible();
    await this.createBlueprintButton.click();
  }

  async completeSoloOnboardingLastWorkingDay(income: number) {
    await this.soloModeButton.click();
    await expect(this.incomeInput).toBeVisible();
    await this.incomeInput.fill(income.toString());
    await expect(this.payCycleSelect).toBeVisible();
    await this.page.getByRole('radio', { name: 'Last working day' }).click();
    await expect(this.createBlueprintButton).toBeVisible();
    await this.createBlueprintButton.click();
  }

  async completeSoloOnboardingEvery4Weeks(income: number, nextPayDate: string) {
    await this.soloModeButton.click();
    await expect(this.incomeInput).toBeVisible();
    await this.incomeInput.fill(income.toString());
    await expect(this.payCycleSelect).toBeVisible();
    await this.page.getByRole('radio', { name: 'Every 4 weeks' }).click();
    await expect(this.anchorDateInput).toBeVisible({ timeout: 5000 });
    await this.anchorDateInput.fill(nextPayDate);
    await expect(this.createBlueprintButton).toBeVisible();
    await this.createBlueprintButton.click();
  }

  async expectRedirectToBlueprint() {
    // Celebration animation can take ~3.3s; allow 60s in CI for redirect to /dashboard/blueprint
    await this.page.waitForURL(/\/blueprint/, { timeout: 60_000 });
    await expect(this.page.getByTestId('blueprint-empty-state')).toBeVisible();
  }

  async logout() {
    await this.page.getByTestId('user-menu-trigger').click();
    await this.page.getByRole('menuitem', { name: 'Log out' }).click();
    await this.page.waitForURL((url) => url.pathname === '/' || /plotbudget\.com/.test(url.href));
  }
}
