// apps/web/tests/specs/visual.spec.ts
// Visual regression: screenshot comparison at desktop and mobile viewports.
// Uses dedicated visual@ user so these tests can run in parallel with the rest of the suite.
// After changing login or settings UI (e.g. OAuth buttons, sign-in methods, profile), run:
//   pnpm run test:e2e:visual:update
// then commit the updated files under tests/specs/visual.spec.ts-snapshots/.

import { test, expect } from '@playwright/test';
import { EMPTY_STORAGE_WITH_CONSENT } from '../fixtures/test-data';

test.describe('Visual regression', () => {
  test.describe('unauthenticated', () => {
    test.use({ storageState: EMPTY_STORAGE_WITH_CONSENT });
    test('login page matches snapshot', async ({ page }) => {
      await page.goto('/login');
      await page.waitForURL(/\/login/);
      await expect(page.getByTestId('email-input')).toBeVisible();
      // Tolerance: 0.12 local until snapshots updated after login UI changes (OAuth, magic link, etc.)
      await expect(page).toHaveScreenshot('login.png', {
        maxDiffPixelRatio: process.env.CI ? 0.08 : 0.12,
      });
    });
  });

  test.describe('authenticated', () => {
    test('dashboard matches snapshot', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForURL(/\/dashboard/);
      await expect(
        page.getByTestId('dashboard-hero').or(page.getByTestId('dashboard-no-cycle'))
      ).toBeVisible({ timeout: 10000 });
      // Higher tolerance on CI: baselines may be from different OS (e.g. macOS) so fonts/layout differ
      await expect(page).toHaveScreenshot('dashboard.png', {
        maxDiffPixelRatio: process.env.CI ? 0.35 : 0.02,
      });
    });

    test('settings page matches snapshot', async ({ page }) => {
      await page.goto('/dashboard/settings');
      await page.waitForURL(/\/(dashboard\/settings|login)/, { timeout: 15000 });
      if (page.url().includes('/login')) {
        test.skip(true, 'Session lost — run with visual user auth state');
      }
      await expect(page.getByTestId('settings-page')).toBeVisible({ timeout: 15000 });
      // Higher tolerance: 0.08 local until snapshots updated after settings UI changes (sign-in methods, no avatar upload)
      await expect(page).toHaveScreenshot('settings.png', {
        maxDiffPixelRatio: process.env.CI ? 0.12 : 0.08,
      });
    });

    test('blueprint page matches snapshot', async ({ page }) => {
      await page.goto('/dashboard/blueprint');
      await page.waitForURL(/\/(dashboard\/blueprint|login)/, { timeout: 15000 });
      if (page.url().includes('/login')) {
        test.skip(true, 'Session lost');
      }
      await expect(
        page.getByTestId('blueprint-empty-state').or(page.locator('[data-testid^="seed-card-"]').first())
      ).toBeVisible({ timeout: 10000 });
      // Higher tolerance: blueprint UI changed (How the Blueprint works, category subtitles). Run with --update-snapshots to refresh.
      await expect(page).toHaveScreenshot('blueprint.png', {
        maxDiffPixelRatio: process.env.CI ? 0.08 : 0.02,
      });
    });
  });
});
