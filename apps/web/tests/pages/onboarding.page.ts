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

  async completeSoloOnboarding(income: number, payCycleDate: number) {
    // Single form: mode, income, pay cycle (radio), then submit
    await this.soloModeButton.click();
    await expect(this.incomeInput).toBeVisible();
    await this.incomeInput.fill(income.toString());
    await expect(this.payCycleSelect).toBeVisible();
    // Pay cycle type is a RadioGroup, not a <select>
    await this.page.getByRole('radio', { name: 'Specific date (e.g., 25th)' }).click();
    // Pay day is a Select dropdown; open and choose the day
    await this.payCycleDateInput.click();
    await this.page.getByRole('option', { name: payCycleDate.toString() }).click();
    await expect(this.createBlueprintButton).toBeVisible();
    await this.createBlueprintButton.click();
  }

  async expectRedirectToBlueprint() {
    await this.page.waitForURL(/\/blueprint/);
    await expect(this.page.getByTestId('blueprint-empty-state')).toBeVisible();
  }
}
