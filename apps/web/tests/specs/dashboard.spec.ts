// apps/web/tests/specs/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard and app shell', () => {
  test('dashboard loads and shows hero or empty state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/dashboard/);
    const hero = page.getByTestId('dashboard-hero');
    const noCycle = page.getByTestId('dashboard-no-cycle');
    await expect(hero.or(noCycle)).toBeVisible({ timeout: 10000 });
  });

  test('settings page loads from user menu', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/dashboard/);
    await page.getByTestId('user-menu-trigger').click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.waitForURL(/\/dashboard\/settings/);
    await expect(page.getByTestId('settings-page')).toBeVisible();
  });

  test('logout redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/dashboard/);
    await page.getByTestId('user-menu-trigger').click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await page.waitForURL(/\/login/);
    await expect(page.getByTestId('email-input')).toBeVisible();
  });
});
