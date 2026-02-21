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

  // Actions — go to the email/password screen (Linear-style: hub → email page)
  async goto() {
    await this.page.goto('/login/email', { waitUntil: 'domcontentloaded' });
    await expect(this.emailInput).toBeVisible();
  }

  /** Go to the login hub (choice of sign-in method). */
  async gotoHub() {
    await this.page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByTestId('login-with-email')).toBeVisible();
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
    await this.page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    const dashboard =
      this.page.getByTestId('dashboard-hero').or(this.page.getByTestId('dashboard-no-cycle')).or(this.page.getByTestId('dashboard-launcher'));
    await expect(dashboard.first()).toBeVisible({ timeout: 15_000 });
  }

  async expectRedirectToOnboarding() {
    await this.page.waitForURL(/\/onboarding/);
    await expect(this.page.getByTestId('onboarding-step-1')).toBeVisible();
  }
}
