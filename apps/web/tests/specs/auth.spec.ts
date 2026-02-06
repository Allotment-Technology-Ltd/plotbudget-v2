// apps/web/tests/specs/auth.spec.ts
import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';

test.describe('Authentication Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // No auth state

  test('user can log in with valid credentials', async ({ page }) => {
    test.setTimeout(60_000);
    const authPage = new AuthPage(page);

    await authPage.goto();
    await authPage.login('solo@plotbudget.test', 'test-password-123');

    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 45_000 });
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

  test('user can navigate to signup page and sees either form or gated waitlist', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const authPage = new AuthPage(page);

    await authPage.goto();
    await authPage.signupLink.click();

    await page.waitForURL(/\/signup/, {
      timeout: 30_000,
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByTestId('signup-page')).toBeVisible({ timeout: 15_000 });
    // When signup is gated: waitlist CTA; when open: signup form
    const formVisible = await page.getByTestId('signup-form').isVisible();
    const gatedVisible = await page.getByTestId('signup-gated-view').isVisible();
    expect(formVisible || gatedVisible).toBeTruthy();
    if (formVisible) {
      await expect(page.getByTestId('submit-signup-form')).toBeVisible();
    } else {
      await expect(page.getByTestId('waitlist-cta')).toBeVisible();
    }
  });

  test('login with redirect param lands on redirect URL after success', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto('/login?redirect=%2Fdashboard%2Fsettings');

    const authPage = new AuthPage(page);
    await authPage.login('dashboard@plotbudget.test', 'test-password-123');

    await page.waitForURL(/\/dashboard\/settings/, { timeout: 45_000 });
    expect(page.url()).toContain('/dashboard/settings');
  });
});
