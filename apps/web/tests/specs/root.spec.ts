// apps/web/tests/specs/root.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Root / redirect (no holding page)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('unauthenticated user visiting / is redirected to login', async ({ page }) => {
    // Use domcontentloaded: redirect can happen before 'load', causing net::ERR_ABORTED
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('email-input')).toBeVisible();
  });
});
