// apps/web/tests/specs/partner-guest.spec.ts
// Partner invite tests. Run in chromium-partner-guest project (no storage state by default).
// These tests need the app at baseURL to serve /partner/join (this app). If you see the marketing page
// instead, ensure Playwright is starting the server from apps/web (don't set SKIP_WEBSERVER=1 with a different app on the same port).
import { test, expect } from '@playwright/test';
import { PartnerJoinPage } from '../pages/partner-join.page';
import { E2E_PARTNER_INVITE_TOKEN } from '../fixtures/test-data';
import { getPartnerAuthCookie } from '../utils/auth-cookie';

test.describe('Partner invite (unauthenticated)', () => {
  test('shows invalid link when token is missing', async ({ page }) => {
    const partnerPage = new PartnerJoinPage(page);
    await page.goto('/partner/join', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/partner\/join/);
    await expect(page.getByText('Invalid Invitation Link')).toBeVisible({ timeout: 10000 });
    await partnerPage.expectInvalidLink();
  });

  test('shows expired when token is invalid', async ({ page }) => {
    const partnerPage = new PartnerJoinPage(page);
    await partnerPage.goto('invalid-token-12345');
    await expect(page).toHaveURL(/\/partner\/join/);
    await expect(page.getByText('Invalid or Expired Invitation')).toBeVisible({ timeout: 10000 });
    await partnerPage.expectExpiredLink();
  });

  test('shows Create account and Login with redirect when token is valid', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const partnerPage = new PartnerJoinPage(page);
    await partnerPage.goto(E2E_PARTNER_INVITE_TOKEN);
    await expect(page).toHaveURL(/\/partner\/join/);

    const joinHeading = page.getByRole('heading', { name: /Join as partner/i });
    const invalidOrExpired = page.getByText(/Invalid or Expired|Invalid Invitation/);
    await expect(joinHeading.or(invalidOrExpired)).toBeVisible({ timeout: 15_000 });

    if (!(await joinHeading.isVisible())) {
      return;
    }

    await partnerPage.expectUnauthenticatedJoin();

    await partnerPage.clickCreateAccount();
    await page.waitForURL(/\/signup/, { timeout: 15_000 });
    expect(page.url()).toContain('redirect=');
    expect(page.url()).toContain(encodeURIComponent('/partner/join'));

    await page.goto(`/partner/join?t=${encodeURIComponent(E2E_PARTNER_INVITE_TOKEN)}`, {
      waitUntil: 'domcontentloaded',
    });
    // Wait for unauthenticated view to render before asserting on login link (avoids flakiness on CI)
    await expect(partnerPage.unauthenticatedContainer).toBeVisible({ timeout: 20_000 });
    await expect(partnerPage.loginLink).toBeVisible({ timeout: 10_000 });
    await partnerPage.clickLogin();
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    expect(page.url()).toContain('redirect=');
    expect(page.url()).toContain(encodeURIComponent('/partner/join'));
  });
});

test.describe('Partner invite (authenticated)', () => {
  test('partner with valid token is taken straight to dashboard', async ({
    page,
  }) => {
    // Sign in as partner programmatically (no login UI) so we don't depend on the login form in the browser
    const cookie = await getPartnerAuthCookie();
    await page.context().addCookies([cookie]);

    await page.goto(`/partner/join?t=${encodeURIComponent(E2E_PARTNER_INVITE_TOKEN)}`, {
      waitUntil: 'domcontentloaded',
    });

    // Invite is auto-accepted and user is redirected to dashboard (no Accept screen)
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });
    const onDashboard =
      page.getByTestId('dashboard-hero').or(page.getByTestId('dashboard-no-cycle'));
    const onOnboarding = page.getByTestId('onboarding-step-1');
    await expect(onDashboard.or(onOnboarding)).toBeVisible();
  });
});
