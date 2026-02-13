import { test, expect } from '@playwright/test';

test.describe('Subscription Portal Error Handling', () => {
  test('should display portal error banner when portal_error query param is set', async ({ page }) => {
    // Navigate to settings with portal_error=true
    await page.goto('http://localhost:3001/dashboard/settings?tab=subscription&portal_error=true');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Look for the error banner
    const errorBanner = page.locator('text=Portal Error');
    
    // Check if error banner is visible
    await expect(errorBanner).toBeVisible();
    
    // Verify error message content
    const errorMessage = page.locator('text=We couldn\'t open the subscription portal. Please try again.');
    await expect(errorMessage).toBeVisible();

    console.log('✓ Portal error banner is displayed correctly');
  });

  test('should not show error banner without portal_error param', async ({ page }) => {
    // Navigate to settings without portal_error param
    await page.goto('http://localhost:3001/dashboard/settings?tab=subscription');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Look for the error banner
    const errorBanner = page.locator('text=Portal Error');
    
    // Check if error banner is NOT visible
    await expect(errorBanner).not.toBeVisible();

    console.log('✓ Portal error banner is hidden when no error');
  });

  test('should have "Manage Subscription" link in subscription tab', async ({ page }) => {
    // Navigate to settings subscription tab
    await page.goto('http://localhost:3001/dashboard/settings?tab=subscription');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Look for manage subscription button/link
    const manageLink = page.locator('text=Manage Subscription').first();
    
    // Check if link exists
    await expect(manageLink).toBeVisible();
    
    // Verify it links to the customer portal API route
    const href = await manageLink.locator('..').locator('a').first().getAttribute('href');
    expect(href).toBe('/api/customer-portal');

    console.log('✓ Manage Subscription link points to /api/customer-portal');
  });
});
