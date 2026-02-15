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
      await expect(page.getByTestId('email-input')).toBeVisible();
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
      await page.waitForURL(/\/dashboard/);
      await expect(page.getByTestId('dashboard-hero').or(page.getByTestId('dashboard-no-cycle'))).toBeVisible({ timeout: 10000 });
      await expectNoHorizontalOverflow(page);
    });

    test('settings page has no horizontal overflow', async ({ page }) => {
      await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });
      await page.waitForURL(/\/(dashboard\/settings|dashboard\/blueprint|login)/, { timeout: 20000 });
      if (page.url().includes('/login')) {
        test.skip(true, 'Session lost — run with authenticated storage state');
      }
      if (page.url().includes('/dashboard/blueprint')) {
        throw new Error(
          'Redirected to /dashboard/blueprint instead of settings. Restart dev server and ensure test user has household (global-setup).'
        );
      }
      await expect(page.getByTestId('settings-page')).toBeVisible({ timeout: 15000 });
      await expectNoHorizontalOverflow(page);
    });

    test('blueprint page has no horizontal overflow', async ({ page }) => {
      await page.goto('/dashboard/blueprint', { waitUntil: 'domcontentloaded' });
      await page.waitForURL(/\/(dashboard\/blueprint|login)/, { timeout: 15000 });
      if (page.url().includes('/login')) {
        test.skip(true, 'Session lost');
      }
      await expect(
        page.getByTestId('blueprint-empty-state').or(page.locator('[data-testid^="seed-card-"]').first())
      ).toBeVisible({ timeout: 10000 });
      await expectNoHorizontalOverflow(page);
    });

    test('app header and content-wrapper do not overflow', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForURL(/\/dashboard/);
      await expect(page.getByTestId('dashboard-hero').or(page.getByTestId('dashboard-no-cycle'))).toBeVisible({ timeout: 10000 });
      await expectNoHorizontalOverflow(page);
      const header = page.locator('header .content-wrapper').first();
      await expect(header).toBeVisible();
      await expectElementInViewport(page, 'header .content-wrapper');
    });
  });
});
