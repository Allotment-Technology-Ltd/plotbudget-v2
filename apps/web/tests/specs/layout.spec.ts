// apps/web/tests/specs/layout.spec.ts
// Automated layout/GUI checks at mobile viewport: no horizontal overflow,
// content not going off the edge of the screen. Run with mobile project in playwright.config.

import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, expectElementInViewport } from '../utils/layout-helpers';

test.describe('Mobile layout — no overflow or content off-screen', () => {
  test.describe('unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test('login page has no horizontal overflow', async ({ page }) => {
      await page.goto('/login');
      await page.waitForURL(/\/login/);
      await expect(page.getByTestId('email-input')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  });

  test.describe('authenticated', () => {
    test('dashboard has no horizontal overflow', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForURL(/\/dashboard/);
      await expect(page.getByTestId('dashboard-hero').or(page.getByTestId('dashboard-no-cycle'))).toBeVisible({ timeout: 10000 });
      await expectNoHorizontalOverflow(page);
    });

    test('settings page has no horizontal overflow', async ({ page }) => {
      await page.goto('/dashboard/settings');
      await page.waitForURL(/\/(dashboard\/settings|login)/, { timeout: 15000 });
      if (page.url().includes('/login')) {
        test.skip(true, 'Session lost — run with authenticated storage state');
      }
      await expect(page.getByTestId('settings-page')).toBeVisible({ timeout: 15000 });
      await expectNoHorizontalOverflow(page);
    });

    test('blueprint page has no horizontal overflow', async ({ page }) => {
      await page.goto('/dashboard/blueprint');
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
      await page.goto('/dashboard');
      await page.waitForURL(/\/dashboard/);
      await expect(page.getByTestId('dashboard-hero').or(page.getByTestId('dashboard-no-cycle'))).toBeVisible({ timeout: 10000 });
      await expectNoHorizontalOverflow(page);
      const header = page.locator('header .content-wrapper').first();
      await expect(header).toBeVisible();
      await expectElementInViewport(page, 'header .content-wrapper');
    });
  });
});
