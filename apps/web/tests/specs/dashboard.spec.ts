// apps/web/tests/specs/dashboard.spec.ts
// Dashboard load tests; settings tests live in settings.spec.ts (dedicated user so logout doesn't invalidate).
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
});
