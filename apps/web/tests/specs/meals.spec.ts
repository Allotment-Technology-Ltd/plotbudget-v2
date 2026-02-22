// apps/web/tests/specs/meals.spec.ts
// Phase 3 Meals & Shopping: recipes, meal plan, shopping list.
// Requires NEXT_PUBLIC_MODULE_MEALS_ENABLED=true in .env.test.local (or env) when starting the dev server
// so the Meals & shopping hub and routes are available. Tests navigate directly to /dashboard/meals.
import { test, expect } from '@playwright/test';
import { ensureBlueprintReady } from '../utils/db-cleanup';
import { TEST_USERS } from '../fixtures/test-data';

const MEALS_TIMEOUT = process.env.CI ? 25_000 : 15_000;

test.describe('Meals & shopping module', () => {
  test.describe.configure({ retries: 1 });

  test.beforeEach(async () => {
    await ensureBlueprintReady(TEST_USERS.visual.email);
  });

  test('meals hub loads and shows sections', async ({ page }) => {
    await page.goto('/dashboard/meals', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForURL(/\/(dashboard\/meals|login)/, { timeout: MEALS_TIMEOUT });
    if (page.url().includes('/login')) {
      throw new Error('Session lost: redirected to login. Use chromium-meals project (visual auth state).');
    }
    await expect(page.getByTestId('meals-hub')).toBeVisible({ timeout: MEALS_TIMEOUT });
    await expect(page.getByTestId('meals-hub-recipes')).toBeVisible();
    await expect(page.getByTestId('meals-hub-meal-plan')).toBeVisible();
    await expect(page.getByTestId('meals-hub-shopping-list')).toBeVisible();
  });

  test('recipes page loads and can open add recipe dialog', async ({ page }) => {
    await page.goto('/dashboard/meals/recipes', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForURL(/\/(dashboard\/meals\/recipes|login)/, { timeout: MEALS_TIMEOUT });
    if (page.url().includes('/login')) {
      throw new Error('Session lost: redirected to login.');
    }
    await expect(page.getByTestId('recipes-page')).toBeVisible({ timeout: MEALS_TIMEOUT });
    await page.getByTestId('recipes-add-recipe').click();
    await expect(page.getByTestId('create-recipe-dialog')).toBeVisible({ timeout: 10_000 });
  });

  test('can create a recipe and see it in list', async ({ page }) => {
    await page.goto('/dashboard/meals/recipes', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForURL(/\/(dashboard\/meals\/recipes|login)/, { timeout: MEALS_TIMEOUT });
    if (page.url().includes('/login')) {
      throw new Error('Session lost: redirected to login.');
    }
    await expect(page.getByTestId('recipes-page')).toBeVisible({ timeout: MEALS_TIMEOUT });
    await page.getByTestId('recipes-add-recipe').click();
    await expect(page.getByTestId('create-recipe-dialog')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('create-recipe-name').fill('E2E Test Recipe');
    await page.getByTestId('create-recipe-servings').fill('2');
    await page.getByTestId('create-recipe-submit').click();
    await expect(page.getByTestId('create-recipe-dialog')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('recipes-list').or(page.getByTestId('recipes-empty'))).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('E2E Test Recipe')).toBeVisible();
  });

  test('shopping list page loads and shows empty state or list', async ({ page }) => {
    await page.goto('/dashboard/meals/grocery', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForURL(/\/(dashboard\/meals\/grocery|login)/, { timeout: MEALS_TIMEOUT });
    if (page.url().includes('/login')) {
      throw new Error('Session lost: redirected to login.');
    }
    await expect(page.getByTestId('grocery-page')).toBeVisible({ timeout: MEALS_TIMEOUT });
    const empty = page.getByTestId('grocery-empty');
    const list = page.getByTestId('grocery-list');
    await expect(empty.or(list)).toBeVisible({ timeout: 10_000 });
  });

});
