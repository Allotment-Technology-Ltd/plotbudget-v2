// apps/web/tests/specs/layout.spec.ts
// Automated layout/GUI checks at mobile viewport: no horizontal overflow,
// content not going off the edge of the screen. Run with mobile project in playwright.config.

import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, expectElementInViewport } from '../utils/layout-helpers';
import { EMPTY_STORAGE_WITH_CONSENT, TEST_USERS } from '../fixtures/test-data';
import { ensureBlueprintReady } from '../utils/db-cleanup';

test.describe('Mobile layout — no overflow or content off-screen', () => {
  test.describe('unauthenticated', () => {
    test.use({ storageState: EMPTY_STORAGE_WITH_CONSENT });
    test('login page has no horizontal overflow', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await page.waitForURL(/\/login/);
      await expect(page.getByTestId('login-with-email')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  });

  test.describe('authenticated', () => {
    // Ensure visual user has a household so /dashboard/settings doesn't redirect to onboarding → blueprint
    test.beforeEach(async () => {
      await ensureBlueprintReady(TEST_USERS.visual.email);
    });

    test('dashboard has no horizontal overflow', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
      if (page.url().includes('/dashboard/payday-complete')) {
        throw new Error(
          'Redirected to payday-complete. ensureBlueprintReady should clear ritual_closed_at for test users.'
        );
      }
      const dashboard =
        page.getByTestId('dashboard-hero').or(page.getByTestId('dashboard-no-cycle')).or(page.getByTestId('dashboard-launcher'));
      await expect(dashboard.first()).toBeVisible({ timeout: process.env.CI ? 20_000 : 15_000 });
      await expectNoHorizontalOverflow(page);
    });

    test('settings page has no horizontal overflow', async ({ page }) => {
      await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });
      await page.waitForURL(/\/(dashboard\/settings|dashboard\/money\/blueprint|login)/, { timeout: 20000 });
      if (page.url().includes('/login')) {
        test.skip(true, 'Session lost — run with authenticated storage state');
      }
      if (page.url().includes('/dashboard/money/blueprint')) {
        throw new Error(
          'Redirected to /dashboard/money/blueprint instead of settings. Restart dev server and ensure test user has household (global-setup).'
        );
      }
      await expect(page.getByTestId('settings-page').first()).toBeVisible({ timeout: 15000 });
      await expectNoHorizontalOverflow(page);
    });

    test('blueprint page has no horizontal overflow', async ({ page }) => {
      await page.goto('/dashboard/money/blueprint', { waitUntil: 'domcontentloaded' });
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
      await expectNoHorizontalOverflow(page);
    });

    test('app header and main content do not overflow', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
      if (page.url().includes('/dashboard/payday-complete')) {
        throw new Error(
          'Redirected to payday-complete. ensureBlueprintReady should clear ritual_closed_at for test users.'
        );
      }
      const dashboard =
        page.getByTestId('dashboard-hero').or(page.getByTestId('dashboard-no-cycle')).or(page.getByTestId('dashboard-launcher'));
      await expect(dashboard.first()).toBeVisible({ timeout: process.env.CI ? 20_000 : 15_000 });
      await expectNoHorizontalOverflow(page);
      // Dashboard layout uses <header> and <main>; no .content-wrapper inside header (unlike marketing/admin)
      const header = page.locator('header').first();
      await expect(header).toBeVisible({ timeout: 5000 });
      await expectElementInViewport(page, 'header');
      const main = page.locator('main').first();
      await expect(main).toBeVisible({ timeout: 5000 });
      await expectElementInViewport(page, 'main');
    });
  });
});
