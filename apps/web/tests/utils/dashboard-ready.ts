import type { Locator, Page } from '@playwright/test';

/**
 * Ready states for the dashboard home route.
 * Supports launcher shell and legacy Money dashboard views.
 */
export function dashboardHomeReadyLocator(page: Page): Locator {
  return page
    .locator(
      '[data-testid="dashboard-launcher"], [data-testid="dashboard-hero"], [data-testid="dashboard-no-cycle"]'
    )
    .first();
}

/**
 * Ready states for post-auth redirects that can land on /dashboard or /dashboard/money/blueprint.
 */
export function dashboardAnyReadyLocator(page: Page): Locator {
  return page
    .locator(
      '[data-testid="dashboard-launcher"], [data-testid="dashboard-hero"], [data-testid="dashboard-no-cycle"], [data-testid="blueprint-empty-state"], [data-testid^="seed-card-"]'
    )
    .first();
}
