// apps/web/tests/pages/auth.page.ts
import { Page, expect } from '@playwright/test';

export class AuthPage {
  constructor(public readonly page: Page) {}

  // Locators
  get emailInput() {
    return this.page.getByTestId('email-input');
  }

  get passwordInput() {
    return this.page.getByTestId('password-input');
  }

  get submitButton() {
    return this.page.getByTestId('submit-login-form');
  }

  get signupLink() {
    return this.page.getByTestId('nav-signup');
  }

  get resetPasswordLink() {
    return this.page.getByTestId('nav-reset-password');
  }

  // Actions
  async goto() {
    await this.page.goto('/login');
    await expect(this.emailInput).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectLoginError() {
    await expect(this.page.getByTestId('login-error-message')).toBeVisible();
  }

  async expectRedirectToDashboard() {
    await this.page.waitForURL(/\/dashboard/);
    await expect(this.page.getByTestId('dashboard-hero')).toBeVisible();
  }

  async expectRedirectToOnboarding() {
    await this.page.waitForURL(/\/onboarding/);
    await expect(this.page.getByTestId('onboarding-step-1')).toBeVisible();
  }
}
