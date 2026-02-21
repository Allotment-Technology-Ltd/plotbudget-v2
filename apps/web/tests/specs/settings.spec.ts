// apps/web/tests/specs/settings.spec.ts
// Settings page tests use a dedicated settings@plotbudget.test user
// and run in the chromium-settings project — isolated from the dashboard
// logout test which would otherwise invalidate the shared session.

import { test, expect } from '@playwright/test';
import { ensureBlueprintReady } from '../utils/db-cleanup';
import { gotoSettingsPage, SKIP_SETTINGS_E2E, SKIP_SETTINGS_E2E_REASON } from '../utils/test-helpers';
import { TEST_USERS } from '../fixtures/test-data';

test.describe('Settings page', () => {
  // Retry once when Next dev server hits intermittent webpack errors under parallel load
  test.describe.configure({ retries: 1 });

  // Ensure settings user has a household so page doesn't redirect to onboarding → blueprint
  test.beforeEach(async () => {
    await ensureBlueprintReady(TEST_USERS.settings.email);
  });

  test('settings page loads when authenticated', async ({ page }) => {
    test.skip(SKIP_SETTINGS_E2E, SKIP_SETTINGS_E2E_REASON);
    await gotoSettingsPage(page, TEST_USERS.settings.email);
    if (page.url().includes('/login')) {
      throw new Error('Session lost: redirected to login. Check baseURL and auth state origin.');
    }
    const settingsPage = page.getByTestId('settings-page').first();
    const serverError = page.getByRole('dialog', { name: 'Server Error' });
    await Promise.race([
      expect(settingsPage).toBeVisible({ timeout: 15_000 }),
      serverError.waitFor({ state: 'visible', timeout: 15_000 }).then(async () => {
        const detail = await page.getByText(/TypeError|useContext|PathnameContext/).first().textContent().catch(() => '');
        throw new Error(`App threw Server Error (e.g. useContext null). Fix the app; then re-run. ${detail ? `Detail: ${detail}` : ''}`);
      }),
    ]);
  });

  test('settings shows who is signed in (owner: Logged in as)', async ({ page }) => {
    test.skip(SKIP_SETTINGS_E2E, SKIP_SETTINGS_E2E_REASON);
    await gotoSettingsPage(page, TEST_USERS.settings.email);
    if (page.url().includes('/login')) {
      throw new Error('Session lost: redirected to login.');
    }
    await expect(page.getByText('Who is signed in', { exact: false })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Logged in as:', { exact: false })).toBeVisible();
  });
});
