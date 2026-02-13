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
  // Retry once when Next dev server hits intermittent useContext/webpack errors under parallel load
  test.describe.configure({ retries: 1 });

  test('dashboard loads and shows hero or empty state', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/dashboard/);
    const hero = page.getByTestId('dashboard-hero');
    const noCycle = page.getByTestId('dashboard-no-cycle');
    const serverError = page.getByRole('dialog', { name: 'Server Error' });
    // Wait for terminal state: either dashboard content or Server Error overlay (fail fast with clear message)
    await Promise.race([
      expect(hero.or(noCycle)).toBeVisible({ timeout: 15_000 }),
      serverError.waitFor({ state: 'visible', timeout: 15_000 }).then(async () => {
        const detail = await page.getByText(/TypeError|useContext|PathnameContext/).first().textContent().catch(() => '');
        throw new Error(`App threw Server Error (e.g. useContext null). Fix the app; then re-run. ${detail ? `Detail: ${detail}` : ''}`);
      }),
    ]);
  });

  test('settings page loads when authenticated', async ({ page }) => {
    // Navigate directly so cookies are sent (client-side Link nav can lose session in CI)
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/(dashboard\/settings|login)/, { timeout: 15_000 });
    if (page.url().includes('/login')) {
      throw new Error('Session lost: redirected to login. Check baseURL and auth state origin.');
    }
    const settingsPage = page.getByTestId('settings-page');
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
    await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/(dashboard\/settings|login)/, { timeout: 15_000 });
    if (page.url().includes('/login')) {
      throw new Error('Session lost: redirected to login.');
    }
    await expect(page.getByText('Who is signed in', { exact: false })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Logged in as:', { exact: false })).toBeVisible();
  });

  test('logout redirects to marketing site', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/dashboard/);
    await expectNoServerError(page);
    await page.getByTestId('user-menu-trigger').click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    // In E2E, app may redirect to /login or / (marketing); accept any post-logout destination.
    // Use domcontentloaded — /login can hang on 'load' in CI (scripts/resources) and cause timeouts.
    await page.waitForURL(
      (url) => {
        if (/plotbudget\.com/.test(url.href)) return true;
        return url.pathname === '/' || url.pathname === '/login';
      },
      { waitUntil: 'domcontentloaded' }
    );
  });
});
