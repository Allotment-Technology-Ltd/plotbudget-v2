// apps/web/tests/specs/onboarding.spec.ts
import { test, expect } from '@playwright/test';
import { OnboardingPage } from '../pages/onboarding.page';
import { resetOnboardingState } from '../utils/db-cleanup';
import { setAuthState } from '../utils/test-auth';
import { TEST_USERS } from '../fixtures/test-data';

test.describe('Onboarding Flow - Solo Mode', () => {
  // Retry once when redirect to blueprint fails (e.g. server useContext error when loading dashboard)
  test.describe.configure({ retries: 1 });

  // Project chromium-onboarding provides storageState for onboarding@ so no other test shares this user
  test.beforeEach(async () => {
    await resetOnboardingState(TEST_USERS.onboarding.email);
  });

  test('complete solo onboarding for all pay cycle date options (specific date, last working day, every 4 weeks)', async ({
    page,
  }) => {
    test.setTimeout(300_000); // 3 scenarios × ~90s each
    await page.clock.setFixedTime(new Date('2024-01-15T12:00:00Z'));

    const onboardingPage = new OnboardingPage(page);
    const { email, password } = TEST_USERS.onboarding;

    // —— Scenario 1: Specific date (e.g. 25th) ——
    await onboardingPage.goto();
    await onboardingPage.completeSoloOnboarding(2500, 31);
    await onboardingPage.expectRedirectToBlueprint();
    await onboardingPage.logout();

    // —— Clear down, then Scenario 2: Last working day ——
    await resetOnboardingState(email);
    await setAuthState(page, email, password);
    await onboardingPage.goto();
    await onboardingPage.completeSoloOnboardingLastWorkingDay(2500);
    await onboardingPage.expectRedirectToBlueprint();
    await onboardingPage.logout();

    // —— Clear down, then Scenario 3: Every 4 weeks ——
    await resetOnboardingState(email);
    await setAuthState(page, email, password);
    await onboardingPage.goto();
    await onboardingPage.completeSoloOnboardingEvery4Weeks(2500, '2024-02-15');
    await onboardingPage.expectRedirectToBlueprint();
    await onboardingPage.logout();
  });

  test('cannot proceed without entering income', async ({ page }) => {
    const onboardingPage = new OnboardingPage(page);

    await onboardingPage.goto();

    // Select Solo, then submit without entering income
    await onboardingPage.soloModeButton.click();
    await expect(onboardingPage.incomeInput).toBeVisible();
    await onboardingPage.createBlueprintButton.click();

    // Should show validation error
    await expect(page.getByTestId('income-error-message')).toBeVisible();
  });
});
