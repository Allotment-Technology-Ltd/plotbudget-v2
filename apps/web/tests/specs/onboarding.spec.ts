// apps/web/tests/specs/onboarding.spec.ts
import { test, expect } from '@playwright/test';
import { OnboardingPage } from '../pages/onboarding.page';
import { resetOnboardingState } from '../utils/db-cleanup';

test.describe('Onboarding Flow - Solo Mode', () => {
  test.use({ storageState: 'tests/.auth/solo.json' });

  test.beforeEach(async () => {
    // Reset so /onboarding is shown (middleware redirects completed users to dashboard)
    await resetOnboardingState('solo@plotbudget.test');
  });

  test('complete solo onboarding with specific date pay cycle', async ({ page }) => {
    // Freeze time to January 15, 2024 for predictable pay cycle dates
    await page.clock.setFixedTime(new Date('2024-01-15T12:00:00Z'));

    const onboardingPage = new OnboardingPage(page);

    await onboardingPage.goto();

    // Complete all steps (requires test IDs on onboarding UI)
    await onboardingPage.completeSoloOnboarding(2500, 31);

    // Should redirect to empty blueprint
    await onboardingPage.expectRedirectToBlueprint();
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
