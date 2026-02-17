// apps/web/tests/auth.setup.ts
import path from 'path';
import fs from 'fs';
import { test as setup, expect } from '@playwright/test';
import { cleanupAllTestUsers } from './utils/db-cleanup';

// Use path set by playwright.config.ts (main process) so setup and chromium use the same file
const authFile =
  process.env.PLAYWRIGHT_AUTH_STATE_PATH ||
  path.resolve(process.cwd(), 'tests', '.auth', 'solo.json');
const authDir = path.dirname(authFile);

setup.describe('authentication setup', () => {
  setup.beforeAll(async () => {
    // Clean test data before running auth setup
    await cleanupAllTestUsers();
  });

  setup('authenticate as solo user', async ({ page }) => {
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    // Navigate to login email page (Linear-style flow: form is on /login/email)
    await page.goto('/login/email');

    // Wait for email/password form to load
    await expect(page.getByTestId('email-input')).toBeVisible();

    // Fill login form
    await page.getByTestId('email-input').fill('solo@plotbudget.test');
    await page.getByTestId('password-input').fill('test-password-123');

    // Submit form
    await page.getByTestId('submit-login-form').click();

    // Wait for redirect to dashboard or onboarding
    await page.waitForURL(/\/(dashboard|onboarding|\?)/);

    // Verify we're logged in (Supabase session exists)
    const cookies = await page.context().cookies();
    const hasAuthCookie = cookies.some(
      (c) => c.name.includes('sb-') && c.name.includes('-auth-token')
    );
    expect(hasAuthCookie).toBeTruthy();

    // Save authentication state
    await page.context().storageState({ path: authFile });

    console.log('✅ Solo user authenticated and state saved');
  });
});
