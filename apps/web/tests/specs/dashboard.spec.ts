// apps/web/tests/specs/dashboard.spec.ts
// Dashboard load + settings-in-dashboard tests (same user; logout test removed). Other settings coverage in settings.spec.ts.
import { test, expect } from '@playwright/test';
import { ensureBlueprintReady } from '../utils/db-cleanup';
import { TEST_USERS } from '../fixtures/test-data';

test.describe('Dashboard and app shell', () => {
  // Retry once when Next dev server hits intermittent useContext/webpack errors under parallel load
  test.describe.configure({ retries: 1 });

  // Ensure dashboard user has a household so /dashboard/settings doesn't redirect to onboarding → blueprint
  test.beforeEach(async () => {
    await ensureBlueprintReady(TEST_USERS.dashboard.email);
  });

  test('dashboard loads and shows hero or empty state', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    if (page.url().includes('/dashboard/payday-complete')) {
      throw new Error(
        'Redirected to payday-complete. ensureBlueprintReady should clear ritual_closed_at for test users; check db-cleanup and global-setup.'
      );
    }
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
    // Accept settings, login, or blueprint (redirect chain: settings → onboarding → blueprint if user has no household)
    await page.waitForURL(/\/(dashboard\/settings|dashboard\/blueprint|login)/, { timeout: 20_000 });
    if (page.url().includes('/login')) {
      throw new Error('Session lost: redirected to login. Check baseURL and auth state origin.');
    }
    if (page.url().includes('/dashboard/blueprint')) {
      throw new Error(
        'Redirected to /dashboard/blueprint instead of settings. Restart the dev server so proxy/middleware changes apply; ensure global-setup ran (dashboard user has household + has_completed_onboarding).'
      );
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
    await page.waitForURL(/\/(dashboard\/settings|dashboard\/blueprint|login)/, { timeout: 20_000 });
    if (page.url().includes('/login')) {
      throw new Error('Session lost: redirected to login.');
    }
    if (page.url().includes('/dashboard/blueprint')) {
      throw new Error(
        'Redirected to /dashboard/blueprint instead of settings. Restart the dev server so proxy changes apply; ensure dashboard user has household (global-setup).'
      );
    }
    await expect(page.getByText('Who is signed in', { exact: false })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Logged in as:', { exact: false })).toBeVisible();
  });
});
