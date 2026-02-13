// PWYL (Pay-What-You-Like) checkout E2E.
// Requires NEXT_PUBLIC_PRICING_ENABLED=true and NEXT_PUBLIC_PWYL_PRICING_ENABLED=true.
// Sandbox flow (redirect to Polar, pay with 4242...) requires POLAR_ACCESS_TOKEN, POLAR_SUCCESS_URL, POLAR_PWYL_BASE_PRODUCT_ID in .env.test.local.
// Note: checkout is authenticated — household_id and user_id are resolved server-side (not in URL).

import { test, expect } from '@playwright/test';

test.describe('PWYL checkout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('pricing page shows PWYL Premium and Start Premium CTA when pricing enabled', async ({
    page,
  }) => {
    // If pricing is disabled we get redirected to dashboard or login
    const url = page.url();
    if (!url.includes('/pricing')) {
      test.skip();
      return;
    }
    await expect(page.getByRole('heading', { name: /Premium|Pay what you want/i })).toBeVisible({
      timeout: 10_000,
    });
    const startPremium = page.getByRole('link', { name: 'Start Premium' });
    if (!(await startPremium.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Start Premium CTA not shown — PWYL pricing may be disabled or user state differs');
      return;
    }
    await expect(startPremium).toHaveAttribute('href', /\/api\/checkout\?.*product=pwyl/);
  });

  test('Start Premium link is a clean checkout URL (no client-side IDs)', async ({ page }) => {
    // household_id and user_id are resolved server-side in the checkout route.
    // The CTA should NOT leak these values in the URL (IDOR prevention).
    const url = page.url();
    if (!url.includes('/pricing')) {
      test.skip();
      return;
    }
    const startPremium = page.getByRole('link', { name: 'Start Premium' });
    if (!(await startPremium.isVisible())) {
      test.skip();
      return;
    }
    const href = await startPremium.getAttribute('href');
    expect(href).toMatch(/\/api\/checkout\?product=pwyl/);
    expect(href).not.toContain('household_id=');
    expect(href).not.toContain('user_id=');
  });
});
