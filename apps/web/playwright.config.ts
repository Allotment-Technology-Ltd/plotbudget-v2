// apps/web/playwright.config.ts
import { config as loadEnv } from 'dotenv';
import path from 'path';
import { defineConfig, devices } from '@playwright/test';

// Load env so SUPABASE_SERVICE_ROLE_KEY etc. are available (.env.test.local overrides .env.local)
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv({ path: path.resolve(process.cwd(), '.env.test.local') });

// When Playwright starts the web server, always hit it at localhost. When SKIP_WEBSERVER=1, use PLAYWRIGHT_TEST_BASE_URL.
const baseURL =
  process.env.SKIP_WEBSERVER === '1'
    ? process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
    : 'http://localhost:3000';

const authDir = path.resolve(process.cwd(), 'tests', '.auth');
const soloStatePath = path.join(authDir, 'solo.json');
const blueprintStatePath = path.join(authDir, 'blueprint.json');
const ritualStatePath = path.join(authDir, 'ritual.json');
const dashboardStatePath = path.join(authDir, 'dashboard.json');
const onboardingStatePath = path.join(authDir, 'onboarding.json');
const visualStatePath = path.join(authDir, 'visual.json');

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

  /* CI: 5 workers. Local: 4 workers so visual + layout + auth + etc. run in parallel without EMFILE */
  workers: process.env.CI ? 5 : 4,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  /* Visual regression: same baselines on all OSes; allow minor pixel variance */
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      pathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}',
    },
  },

  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL,

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
      name: 'smoke',
      testMatch: [/smoke\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
    },
    {
      name: 'chromium',
      testMatch: [/auth\.spec\.ts/, /root\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        storageState: soloStatePath,
      },
    },
    {
      name: 'chromium-onboarding',
      testMatch: [/onboarding\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        storageState: onboardingStatePath,
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
      name: 'chromium-dashboard',
      testMatch: [/dashboard\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        storageState: dashboardStatePath,
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
    {
      name: 'chromium-partner-guest',
      testMatch: [/partner-guest\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
    },
    {
      name: 'chromium-pwyl',
      testMatch: [/pwyl\.checkout\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        storageState: dashboardStatePath,
      },
    },

    /* Mobile viewport layout checks — use visual user so dashboard logout doesn't invalidate session */
    {
      name: 'mobile-layout',
      testMatch: [/layout\.spec\.ts/],
      use: {
        ...devices['Pixel 5'],
        storageState: visualStatePath,
        viewport: { width: 393, height: 851 },
      },
    },

    /* Visual regression — dedicated user so runs in parallel with rest of suite */
    {
      name: 'visual-desktop',
      testMatch: [/visual\.spec\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        storageState: visualStatePath,
      },
    },
    {
      name: 'visual-mobile',
      testMatch: [/visual\.spec\.ts/],
      use: {
        ...devices['Pixel 5'],
        storageState: visualStatePath,
        viewport: { width: 393, height: 851 },
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
      reuseExistingServer: true,
      stdout: 'ignore',
      stderr: 'pipe',
      timeout: 120 * 1000, // 2 minutes for Next.js to start
    },
  }),
});
