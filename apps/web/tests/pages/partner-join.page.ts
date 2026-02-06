// apps/web/tests/pages/partner-join.page.ts
import { Page, expect } from '@playwright/test';

export class PartnerJoinPage {
  constructor(public readonly page: Page) {}

  async goto(token: string) {
    await this.page.goto(`/partner/join?t=${encodeURIComponent(token)}`, {
      waitUntil: 'domcontentloaded',
    });
  }

  get invalidLinkContainer() {
    return this.page.getByTestId('partner-join-invalid');
  }

  get expiredLinkContainer() {
    return this.page.getByTestId('partner-join-expired');
  }

  get unauthenticatedContainer() {
    return this.page.getByTestId('partner-join-unauthenticated');
  }

  get authenticatedContainer() {
    return this.page.getByTestId('partner-join-authenticated');
  }

  get createAccountLink() {
    return this.page.getByTestId('partner-join-signup');
  }

  get loginLink() {
    return this.page.getByTestId('partner-join-login');
  }

  get acceptButton() {
    return this.page.getByTestId('partner-join-accept');
  }

  async expectInvalidLink() {
    await expect(this.invalidLinkContainer).toBeVisible({ timeout: 10000 });
    await expect(this.page.getByText('Invalid Invitation Link')).toBeVisible();
  }

  async expectExpiredLink() {
    await expect(this.expiredLinkContainer).toBeVisible({ timeout: 10000 });
    await expect(this.page.getByText('Invalid or Expired Invitation')).toBeVisible();
  }

  async expectUnauthenticatedJoin() {
    await expect(this.unauthenticatedContainer).toBeVisible({ timeout: 10000 });
    await expect(this.page.getByRole('heading', { name: /Join as partner/i })).toBeVisible();
    await expect(this.createAccountLink).toBeVisible();
    await expect(this.loginLink).toBeVisible();
  }

  async expectAuthenticatedJoin() {
    await expect(this.authenticatedContainer).toBeVisible();
    await expect(this.acceptButton).toBeVisible();
  }

  async clickCreateAccount() {
    await this.createAccountLink.click();
  }

  async clickLogin() {
    await this.loginLink.click();
  }

  async clickAccept() {
    await this.acceptButton.click();
  }
}
