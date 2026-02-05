// apps/web/tests/specs/auth.spec.ts
import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';

test.describe('Authentication Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // No auth state

  test('user can log in with valid credentials', async ({ page }) => {
    const authPage = new AuthPage(page);

    await authPage.goto();
    await authPage.login('solo@plotbudget.test', 'test-password-123');

    // Should redirect to dashboard (or onboarding if not yet completed)
    await page.waitForURL(/\/(dashboard|onboarding)/);
    if (page.url().includes('/dashboard')) {
      await authPage.expectRedirectToDashboard();
    }
  });

  test('user sees error with invalid password', async ({ page }) => {
    const authPage = new AuthPage(page);

    await authPage.goto();
    await authPage.login('solo@plotbudget.test', 'wrong-password');

    await authPage.expectLoginError();
  });

  test('user can navigate to signup page', async ({ page }) => {
    const authPage = new AuthPage(page);

    await authPage.goto();
    await authPage.signupLink.click();

    await page.waitForURL(/\/signup/);
    // Signup page is currently a private beta placeholder (no form)
    await expect(page.getByTestId('signup-page')).toBeVisible();
  });
});
