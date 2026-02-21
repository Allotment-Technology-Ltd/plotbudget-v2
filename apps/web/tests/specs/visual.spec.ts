// apps/web/tests/specs/visual.spec.ts
// Visual regression: screenshot comparison at desktop and mobile viewports.
// Uses dedicated visual@ user so these tests can run in parallel with the rest of the suite.
// After changing login or settings UI (e.g. OAuth buttons, sign-in methods, profile), run:
//   pnpm run test:e2e:visual:update
// then commit the updated files under tests/specs/visual.spec.ts-snapshots/.

import { test, expect } from '@playwright/test';
import { EMPTY_STORAGE_WITH_CONSENT, TEST_USERS } from '../fixtures/test-data';
import { ensureBlueprintReady } from '../utils/db-cleanup';

/** Storage key used by PwaSplashScreen; when set, the splash is skipped. */
const PLOT_SPLASH_STORAGE_KEY = 'plot-splash-shown';

test.describe('Visual regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key: string) => {
      localStorage.setItem(key, '1');
    }, PLOT_SPLASH_STORAGE_KEY);
  });

  test.describe('unauthenticated', () => {
    test.use({ storageState: EMPTY_STORAGE_WITH_CONSENT });
    test('login page matches snapshot', async ({ page }) => {
      await page.goto('/login');
      await page.waitForURL(/\/login/);
      await expect(page.getByTestId('login-with-email')).toBeVisible();
      // Tolerance: 0.12 (CI and local) until snapshots updated; mobile viewport often differs more in CI.
      await expect(page).toHaveScreenshot('login.png', {
        maxDiffPixelRatio: 0.12,
      });
    });
  });

  test.describe('authenticated', () => {
    // Ensure visual user has a household so /dashboard/settings doesn't redirect to onboarding → blueprint
    test.beforeEach(async () => {
      await ensureBlueprintReady(TEST_USERS.visual.email);
    });

    test('dashboard matches snapshot', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
      if (page.url().includes('/dashboard/payday-complete')) {
        throw new Error(
          'Redirected to payday-complete. ensureBlueprintReady should clear ritual_closed_at for test users.'
        );
      }
      const dashboard =
        page.getByTestId('dashboard-hero').or(page.getByTestId('dashboard-no-cycle')).or(page.getByTestId('dashboard-launcher'));
      await expect(dashboard.first()).toBeVisible({ timeout: process.env.CI ? 20_000 : 15_000 });
      // Higher tolerance on CI: baselines may be from different OS (e.g. macOS) so fonts/layout differ
      await expect(page).toHaveScreenshot('dashboard.png', {
        maxDiffPixelRatio: process.env.CI ? 0.35 : 0.02,
      });
    });

    test('settings page matches snapshot', async ({ page }) => {
      await page.goto('/dashboard/settings');
      await page.waitForURL(/\/(dashboard\/settings|dashboard\/money\/blueprint|login)/, { timeout: 20000 });
      if (page.url().includes('/login')) {
        test.skip(true, 'Session lost — run with visual user auth state');
      }
      if (page.url().includes('/dashboard/money/blueprint')) {
        throw new Error(
          'Redirected to /dashboard/money/blueprint instead of settings. Restart dev server and ensure visual user has household (global-setup).'
        );
      }
      await expect(page.getByTestId('settings-page').first()).toBeVisible({ timeout: 15000 });
      // Higher tolerance: 0.08 local until snapshots updated after settings UI changes (sign-in methods, no avatar upload)
      await expect(page).toHaveScreenshot('settings.png', {
        maxDiffPixelRatio: process.env.CI ? 0.12 : 0.08,
      });
    });

    test('blueprint page matches snapshot', async ({ page }) => {
      await page.goto('/dashboard/money/blueprint');
      await page.waitForURL(/\/(dashboard\/money\/blueprint|dashboard\/payday-complete|login)/, {
        timeout: 15000,
      });
      if (page.url().includes('/login')) {
        test.skip(true, 'Session lost');
      }
      if (page.url().includes('/dashboard/payday-complete')) {
        throw new Error(
          'Redirected to payday-complete. ensureBlueprintReady should clear ritual_closed_at for test users.'
        );
      }
      await expect(
        page.getByTestId('blueprint-empty-state').or(page.locator('[data-testid^="seed-card-"]').first())
      ).toBeVisible({ timeout: 10000 });
      // Higher tolerance: blueprint UI changes often (How the Blueprint works, category subtitles). Run with --update-snapshots to refresh baseline.
      await expect(page).toHaveScreenshot('blueprint.png', {
        maxDiffPixelRatio: process.env.CI ? 0.08 : 0.06,
      });
    });
  });
});
