// apps/web/tests/specs/root.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Root / redirect (no holding page)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('unauthenticated user visiting / is redirected to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('email-input')).toBeVisible();
  });
});
