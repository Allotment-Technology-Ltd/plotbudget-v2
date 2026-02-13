import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Dismiss cookie consent banner if visible.
 * Call after navigation, before any other interactions.
 * CI uses fresh browser contexts with no consent cookie, so the banner blocks clicks.
 */
export async function dismissCookieBanner(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: /Essential only/i });
  try {
    if (await btn.isVisible({ timeout: 3000 })) {
      await btn.click();
      await expect(
        page.getByRole('dialog', { name: /Cookie preferences/i })
      ).not.toBeVisible({ timeout: 5000 });
    }
  } catch {
    // Banner not present — no-op
  }
}
