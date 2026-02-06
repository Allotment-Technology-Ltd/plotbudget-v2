// apps/web/tests/specs/dashboard.spec.ts
import { test, expect } from '@playwright/test';

/** Fail fast with a clear message if the app threw a Server Error (e.g. useContext null). */
async function expectNoServerError(page: import('@playwright/test').Page) {
  const serverErrorDialog = page.getByRole('dialog', { name: 'Server Error' });
  if (await serverErrorDialog.isVisible().catch(() => false)) {
    const detail = await page.getByText(/TypeError|useContext|PathnameContext/).first().textContent().catch(() => '');
    throw new Error(`App threw Server Error (e.g. useContext null). Fix the app; then re-run. ${detail ? `Detail: ${detail}` : ''}`);
  }
}

test.describe('Dashboard and app shell', () => {
  test('dashboard loads and shows hero or empty state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/dashboard/);
    await expectNoServerError(page);
    const hero = page.getByTestId('dashboard-hero');
    const noCycle = page.getByTestId('dashboard-no-cycle');
    await expect(hero.or(noCycle)).toBeVisible({ timeout: 10000 });
  });

  test('settings page loads when authenticated', async ({ page }) => {
    // Navigate directly so cookies are sent (client-side Link nav can lose session in CI)
    await page.goto('/dashboard/settings');
    await page.waitForURL(/\/(dashboard\/settings|login)/, { timeout: 15_000 });
    if (page.url().includes('/login')) {
      throw new Error('Session lost: redirected to login. Check baseURL and auth state origin.');
    }
    await expect(page.getByTestId('settings-page')).toBeVisible({ timeout: 15_000 });
  });

  test('settings shows who is signed in (owner: Logged in as)', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForURL(/\/(dashboard\/settings|login)/, { timeout: 15_000 });
    if (page.url().includes('/login')) {
      throw new Error('Session lost: redirected to login.');
    }
    await expect(page.getByText('Who is signed in', { exact: false })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Logged in as:', { exact: false })).toBeVisible();
  });

  test('logout redirects to marketing site', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/dashboard/);
    await expectNoServerError(page);
    await page.getByTestId('user-menu-trigger').click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    // In E2E, NEXT_PUBLIC_MARKETING_URL may be localhost so we stay on app origin; accept either
    await page.waitForURL((url) => {
      if (/plotbudget\.com/.test(url.href)) return true;
      return url.pathname === '/';
    });
  });
});
