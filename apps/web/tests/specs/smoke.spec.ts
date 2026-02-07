// Minimal smoke tests for Vercel Preview (and localhost). Fast checks that the app is up and auth entry works.
import { test, expect } from '@playwright/test';

test.describe('Smoke', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('unauthenticated / redirects to login and login form is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
  });
});
