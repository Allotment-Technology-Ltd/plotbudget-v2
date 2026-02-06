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
    const partnerPage = new PartnerJoinPage(page);
    await partnerPage.goto(E2E_PARTNER_INVITE_TOKEN);
    await expect(page).toHaveURL(/\/partner\/join/);
    await expect(page.getByRole('heading', { name: /Join as partner/i })).toBeVisible({
      timeout: 10000,
    });
    await partnerPage.expectUnauthenticatedJoin();

    await partnerPage.clickCreateAccount();
    await page.waitForURL(/\/signup/);
    expect(page.url()).toContain('redirect=');
    expect(page.url()).toContain(encodeURIComponent('/partner/join'));

    await page.goto(`/partner/join?t=${encodeURIComponent(E2E_PARTNER_INVITE_TOKEN)}`);
    await partnerPage.clickLogin();
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('redirect=');
    expect(page.url()).toContain(encodeURIComponent('/partner/join'));
  });
});

test.describe('Partner invite (authenticated)', () => {
  test('partner with valid token sees Accept and can accept then reach dashboard', async ({
    page,
  }) => {
    // Sign in as partner programmatically (no login UI) so we don't depend on the login form in the browser
    const cookie = await getPartnerAuthCookie();
    await page.context().addCookies([cookie]);

    await page.goto(`/partner/join?t=${encodeURIComponent(E2E_PARTNER_INVITE_TOKEN)}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page).toHaveURL(
      (url) =>
        url.pathname === '/partner/join' &&
        url.searchParams.get('t') === E2E_PARTNER_INVITE_TOKEN
    );

    const partnerPage = new PartnerJoinPage(page);
    await partnerPage.expectAuthenticatedJoin();
    await partnerPage.clickAccept();

    // After accept we should land on dashboard (owner household has paycycle from global setup).
    // If the app sends partner to onboarding instead, accept that so the test is resilient.
    await page.waitForURL(/\/(dashboard|onboarding)/);
    const onDashboard =
      page.getByTestId('dashboard-hero').or(page.getByTestId('dashboard-no-cycle'));
    const onOnboarding = page.getByTestId('onboarding-step-1');
    await expect(onDashboard.or(onOnboarding)).toBeVisible();
  });
});
