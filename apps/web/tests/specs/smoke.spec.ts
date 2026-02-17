// Minimal smoke tests for Vercel Preview (and localhost). Fast checks that the app is up and auth entry works.
import { test, expect } from '@playwright/test';
import { EMPTY_STORAGE_WITH_CONSENT } from '../fixtures/test-data';
import { dismissCookieBanner } from '../utils/cookie-banner';

test.describe('Smoke', () => {
  test.use({ storageState: EMPTY_STORAGE_WITH_CONSENT });

  test('unauthenticated / redirects to login and login form is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('login-with-email')).toBeVisible();
    await dismissCookieBanner(page);
  });
});
