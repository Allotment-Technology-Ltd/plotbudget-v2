// apps/web/playwright.config.ts
import { config as loadEnv } from 'dotenv';
import path from 'path';
import { defineConfig, devices } from '@playwright/test';

// Load env so SUPABASE_SERVICE_ROLE_KEY etc. are available (.env.test.local overrides .env.local)
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: path.resolve(process.cwd(), '.env.test.local') });

const authDir = path.resolve(process.cwd(), 'tests', '.auth');
const soloStatePath = path.join(authDir, 'solo.json');
const blueprintStatePath = path.join(authDir, 'blueprint.json');
const ritualStatePath = path.join(authDir, 'ritual.json');

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: './tests/global-setup.ts',
  testDir: './tests/specs',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      testMatch: [/auth\.spec\.ts/, /onboarding\.spec\.ts/, /dashboard\.spec\.ts/, /root\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        storageState: soloStatePath,
      },
    },
    {
      name: 'chromium-blueprint',
      testMatch: [/blueprint\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        storageState: blueprintStatePath,
      },
    },
    {
      name: 'chromium-ritual',
      testMatch: [/ritual\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        storageState: ritualStatePath,
      },
    },

    // Uncomment when you need cross-browser testing
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: 'tests/.auth/solo.json',
    //   },
    //   dependencies: ['setup'],
    // },

    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: 'tests/.auth/solo.json',
    //   },
    //   dependencies: ['setup'],
    // },

    /* Test against mobile viewports (future phase) */
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //     storageState: 'tests/.auth/solo.json',
    //   },
    //   dependencies: ['setup'],
    // },
  ],

  /* Run your local dev server before starting the tests (skip when SKIP_WEBSERVER=1 and dev is already running) */
  ...(process.env.SKIP_WEBSERVER !== '1' && {
    webServer: {
      command: 'pnpm dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
      timeout: 120 * 1000, // 2 minutes for Next.js to start
    },
  }),
});
