// Regression tests for Phase 1 (Tasks, Projects, Weekly Reset) and Phase 2 (Calendar).
// Run: pnpm test:e2e -- tasks-calendar
// Requires: migrations applied, global-setup (dashboard user with household).
import { test, expect } from '@playwright/test';
import { ensureBlueprintReady } from '../utils/db-cleanup';
import { TEST_USERS } from '../fixtures/test-data';

test.describe('Tasks module', () => {
  test.describe.configure({ retries: 1 });

  test.beforeEach(async () => {
    await ensureBlueprintReady(TEST_USERS.dashboard.email);
  });

  test('tasks page loads with list view and add button', async ({ page }) => {
    await page.goto('/dashboard/tasks', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForURL(/\/dashboard\/tasks/, { timeout: 15_000 });
    if (page.url().includes('/login')) {
      throw new Error('Session lost: redirected to login.');
    }
    if (page.url().includes('/onboarding')) {
      throw new Error('User has no household; redirect to onboarding.');
    }
    await expect(page.getByRole('heading', { name: /^Tasks$/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /add task/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /list/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /kanban/i })).toBeVisible();
  });

  test('kanban view shows four columns', async ({ page }) => {
    await page.goto('/dashboard/tasks', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForURL(/\/dashboard\/tasks/, { timeout: 15_000 });
    await page.getByRole('button', { name: /kanban/i }).click();
    await expect(page.getByText('Backlog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('To do')).toBeVisible();
    await expect(page.getByText('In progress')).toBeVisible();
    await expect(page.getByText('Done')).toBeVisible();
  });

  test('create task dialog opens and closes', async ({ page }) => {
    await page.goto('/dashboard/tasks', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForURL(/\/dashboard\/tasks/, { timeout: 15_000 });
    await page.getByRole('button', { name: /add task/i }).click();
    await expect(page.getByRole('dialog', { name: /add task/i })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog', { name: /add task/i })).not.toBeVisible();
  });

  test('create task (minimal) persists', async ({ page }) => {
    await page.goto('/dashboard/tasks', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForURL(/\/dashboard\/tasks/, { timeout: 15_000 });
    await page.getByRole('button', { name: /add task/i }).click();
    await expect(page.getByRole('dialog', { name: /add task/i })).toBeVisible({ timeout: 5_000 });
    await page.getByLabel(/name/i).fill('E2E regression task');
    await page.getByRole('button', { name: /^add task$/i }).click();
    await expect(page.getByRole('dialog', { name: /add task/i })).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('E2E regression task')).toBeVisible({ timeout: 5_000 });
  });

  test('projects list page loads', async ({ page }) => {
    await page.goto('/dashboard/tasks/projects', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForURL(/\/dashboard\/tasks\/projects/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /^Projects$/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /back to tasks/i })).toBeVisible();
  });

  test('weekly reset page loads full-screen with greeting', async ({ page }) => {
    await page.goto('/dashboard/tasks/weekly-reset', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForURL(/\/dashboard\/tasks\/weekly-reset/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /hey/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /let's go/i })).toBeVisible();
    await expect(page.getByLabel(/exit weekly reset/i)).toBeVisible();
  });

  test('weekly reset step 2 after Let\'s go', async ({ page }) => {
    await page.goto('/dashboard/tasks/weekly-reset', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForURL(/\/dashboard\/tasks\/weekly-reset/, { timeout: 15_000 });
    await page.getByRole('button', { name: /let's go/i }).click();
    await expect(page.getByRole('heading', { name: /review auto-generated tasks/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /^next$/i })).toBeVisible();
  });
});

test.describe('Calendar module', () => {
  test.describe.configure({ retries: 1 });

  test.beforeEach(async () => {
    await ensureBlueprintReady(TEST_USERS.dashboard.email);
  });

  test('calendar page loads with month view', async ({ page }) => {
    await page.goto('/dashboard/calendar', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForURL(/\/dashboard\/calendar/, { timeout: 15_000 });
    if (page.url().includes('/login')) {
      throw new Error('Session lost: redirected to login.');
    }
    await expect(page.getByRole('heading', { name: /^Calendar$/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /today/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /month/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /week/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /day/i })).toBeVisible();
  });

  test('week and day views switch', async ({ page }) => {
    await page.goto('/dashboard/calendar', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForURL(/\/dashboard\/calendar/, { timeout: 15_000 });
    await page.getByRole('button', { name: /^week$/i }).click();
    await expect(page.getByText(/week of/i)).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /^day$/i }).click();
    await expect(page.getByText(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i)).toBeVisible({ timeout: 5_000 });
  });
});
