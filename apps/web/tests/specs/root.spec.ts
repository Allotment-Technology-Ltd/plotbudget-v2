// apps/web/tests/specs/root.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Root / landing page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('home page loads and shows CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();
    await expect(page.getByTestId('cta-signup')).toBeVisible();
    await expect(page.getByTestId('cta-learn-more')).toBeVisible();
  });

  test('CTA signup navigates to signup', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('cta-signup').click();
    await page.waitForURL(/\/signup/);
    await expect(page.getByTestId('signup-page')).toBeVisible();
  });

  test('CTA learn more scrolls to section', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('cta-learn-more').click();
    await expect(page.locator('#why-plot')).toBeVisible();
  });
});
