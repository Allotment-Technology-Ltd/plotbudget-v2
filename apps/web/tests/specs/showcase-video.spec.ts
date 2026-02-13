/**
 * Records short videos of the dashboard in light and dark theme for the marketing site.
 * Run with: pnpm exec playwright test tests/specs/showcase-video.spec.ts --project=showcase-video
 * Then copy videos to marketing: pnpm run copy-showcase-videos
 *
 * Requires global setup (visual user) and dev server. Videos are saved as WebM; the copy script
 * places them in apps/marketing/public/videos/ as dashboard-light.webm and dashboard-dark.webm.
 */
import { test, expect } from '@playwright/test';

const RECORD_SECONDS = 12;

test.describe('Showcase video recording', () => {
  test('record dashboard (light)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('theme', 'light');
    });
    await page.goto('/dashboard');
    await page.waitForURL(/\/dashboard/);
    await expect(
      page.getByTestId('dashboard-hero').or(page.getByTestId('dashboard-no-cycle'))
    ).toBeVisible({ timeout: 15_000 });
    await new Promise((r) => setTimeout(r, RECORD_SECONDS * 1000));
  });

  test('record dashboard (dark)', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('theme', 'dark');
    });
    await page.goto('/dashboard');
    await page.waitForURL(/\/dashboard/);
    await expect(
      page.getByTestId('dashboard-hero').or(page.getByTestId('dashboard-no-cycle'))
    ).toBeVisible({ timeout: 15_000 });
    await new Promise((r) => setTimeout(r, RECORD_SECONDS * 1000));
  });
});
