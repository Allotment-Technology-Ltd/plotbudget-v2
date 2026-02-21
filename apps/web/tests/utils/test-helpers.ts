// apps/web/tests/utils/test-helpers.ts
// Custom matchers, waiters, and shared utilities for E2E tests.
// Add helpers here as needed (e.g. waitForApiResponse, custom expect matchers).

import type { Page } from '@playwright/test';
import { ensureBlueprintReady } from './db-cleanup';

/**
 * Skip the /dashboard/settings E2E tests when the server or redirect issue recurs.
 * Set to true to unblock the suite; set to false to run settings tests after fixes (server error, same Supabase env).
 */
export const SKIP_SETTINGS_E2E = false;
export const SKIP_SETTINGS_E2E_REASON =
  'Settings E2E blocked: server error on /dashboard/settings and/or redirect to blueprint; fix then set SKIP_SETTINGS_E2E = false in test-helpers.ts';

const SETTINGS_URL_TIMEOUT = 18_000;

/**
 * Navigate to /dashboard/settings so the test can assert on the settings page.
 * Ensures the user has a household (so the app doesn't redirect to onboarding → blueprint),
 * then navigates. If we land on blueprint (waitForURL times out), retries once after
 * re-ensuring household.
 * Use for dashboard and visual projects (dashboard@ and visual@).
 */
export async function gotoSettingsPage(
  page: Page,
  userEmail: string,
  options?: { waitUntil?: 'domcontentloaded' | 'load' }
): Promise<void> {
  const waitUntil = options?.waitUntil ?? 'domcontentloaded';

  async function tryGoto(): Promise<boolean> {
    await ensureBlueprintReady(userEmail);
    await page.goto('/dashboard/settings', { waitUntil, timeout: 30_000 });
    try {
      await page.waitForURL(/\/(dashboard\/settings|login)/, {
        timeout: SETTINGS_URL_TIMEOUT,
        waitUntil: 'domcontentloaded',
      });
      return true;
    } catch {
      return false;
    }
  }

  const ok = await tryGoto();
  if (!ok && page.url().includes('/dashboard/money/blueprint')) {
    await tryGoto();
  }
  if (page.url().includes('/dashboard/money/blueprint')) {
    throw new Error(
      `Still on /dashboard/money/blueprint after ensuring household for ${userEmail}. ` +
        'Check that the app and E2E use the same Supabase project (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).'
    );
  }
}
