/**
 * Generate grocery list items from meal plan entries (recipes × dates).
 * Aggregates ingredients so:
 * - Same ingredient repeated within one recipe (e.g. butter in two steps) → single line with total.
 * - Same ingredient across multiple recipes in the week → single line with cumulative total.
 * Quantities are grouped by (name, unit) so e.g. "2 tbsp butter" + "1 tbsp butter" → "3 tbsp butter";
 * "2 tbsp butter" + "50g butter" remain two lines (different units).
 */

import type { RecipeIngredient } from './schemas';
import { aggregateIngredientLines } from './ingredient-aggregation';

export interface RecipeWithServings {
  id: string;
  ingredients: RecipeIngredient[];
  servings: number;
}

export interface MealPlanEntryForGrocery {
  id: string;
  recipe_id: string;
  planned_date: string;
  servings: number | null;
  recipe: RecipeWithServings;
}

export interface GroceryItemInsert {
  name: string;
  quantity_text: string | null;
  quantity_value: number | null;
  quantity_unit: string | null;
  source_recipe_id: string | null;
  source_meal_plan_entry_id: string | null;
  sort_order: number;
}

/**
 * Scale recipe ingredients by (entryServings / recipeServings).
 * Returns ingredient lines with optional scaled quantity (we keep quantity as string for display).
 */
function scaledIngredients(
  ingredients: RecipeIngredient[],
  entryServings: number,
  recipeServings: number
): Array<{ name: string; quantity?: string | null }> {
  if (recipeServings <= 0) return ingredients.map((i) => ({ name: i.name, quantity: i.quantity }));
  const scale = entryServings / recipeServings;
  return ingredients.map((i) => {
    if (!i.quantity) return { name: i.name, quantity: null };
    // Simple scaling: if quantity parses as number, multiply and re-append unit
    const match = i.quantity.match(/^([\d.,]+)\s*(.*)$/);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, '.'));
      const rest = match[2].trim();
      if (!Number.isNaN(num)) {
        const scaled = Math.round(num * scale * 100) / 100;
        return { name: i.name, quantity: rest ? `${scaled} ${rest}` : String(scaled) };
      }
    }
    return { name: i.name, quantity: i.quantity };
  });
}

/**
 * From meal plan entries (with recipes loaded), produce a list of grocery item inserts
 * with aggregated quantities. Does not set household_id (caller adds that).
 */
export function generateGroceryItemsFromMealPlan(
  entries: MealPlanEntryForGrocery[]
): GroceryItemInsert[] {
  const allLines: Array<{ name: string; quantity?: string | null }> = [];
  for (const entry of entries) {
    const servings = entry.servings ?? entry.recipe.servings ?? 1;
    const lines = scaledIngredients(
      entry.recipe.ingredients,
      servings,
      entry.recipe.servings || 1
    );
    for (const line of lines) {
      allLines.push(line);
    }
  }
  const aggregated = aggregateIngredientLines(allLines);
  return aggregated.map((a, i) => ({
    name: a.name,
    quantity_text: a.quantityText || null,
    quantity_value: a.quantityValue,
    quantity_unit: a.quantityUnit,
    source_recipe_id: null,
    source_meal_plan_entry_id: null,
    sort_order: i,
  }));
}
