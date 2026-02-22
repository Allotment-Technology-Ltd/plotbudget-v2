/**
 * Match recipe ingredients to pantry stock (advisory) and compute deductions when marking a meal as cooked.
 * Uses same name normalization and unit handling as ingredient-aggregation.
 */

import type { RecipeIngredient } from './schemas';
import { normalizeIngredientName, parseIngredientLine } from './ingredient-aggregation';

export interface PantryItemForMatch {
  id: string;
  name: string;
  quantity_value: number | null;
  quantity_unit: string | null;
  location: string;
}

/** One recipe ingredient line with parsed value/unit (scaled by servings). */
interface ScaledIngredient {
  name: string;
  nameKey: string;
  quantityText: string;
  value: number | null;
  unit: string | null;
}

function scaleRecipeIngredients(
  ingredients: RecipeIngredient[],
  entryServings: number,
  recipeServings: number
): ScaledIngredient[] {
  if (recipeServings <= 0) {
    return ingredients.map((i) => {
      const parsed = parseIngredientLine(i.name, i.quantity);
      return {
        name: parsed.name,
        nameKey: parsed.nameKey,
        quantityText: parsed.quantityText || i.name,
        value: parsed.value,
        unit: parsed.unit,
      };
    });
  }
  const scale = entryServings / recipeServings;
  return ingredients.map((i) => {
    const parsed = parseIngredientLine(i.name, i.quantity);
    const value = parsed.value != null ? Math.round(parsed.value * scale * 100) / 100 : null;
    const qText = parsed.quantityText;
    const newText =
      value != null && parsed.unit
        ? `${value} ${parsed.unit}`
        : value != null
          ? String(value)
          : qText;
    return {
      name: parsed.name,
      nameKey: parsed.nameKey,
      quantityText: newText,
      value,
      unit: parsed.unit,
    };
  });
}

/** Normalize unit for comparison (lowercase, trimmed). */
function unitKey(u: string | null): string {
  return (u ?? '').trim().toLowerCase();
}

/**
 * Advisory: which recipe ingredients have a matching pantry item (same normalized name).
 * Same unit is preferred but we still report matches with different units so user can "check amounts".
 */
export interface PantryAdvisoryMatch {
  ingredientName: string;
  recipeQuantityText: string;
  pantryId: string;
  pantryQuantityText: string;
  pantryLocation: string;
}

export function matchRecipeIngredientsToPantry(
  ingredients: RecipeIngredient[],
  pantryItems: PantryItemForMatch[],
  entryServings: number = 1,
  recipeServings: number = 1
): PantryAdvisoryMatch[] {
  const scaled = scaleRecipeIngredients(ingredients, entryServings, recipeServings);
  const pantryByKey = new Map<string, PantryItemForMatch[]>();
  for (const p of pantryItems) {
    const key = normalizeIngredientName(p.name);
    if (!pantryByKey.has(key)) pantryByKey.set(key, []);
    pantryByKey.get(key)!.push(p);
  }
  const results: PantryAdvisoryMatch[] = [];
  for (const ing of scaled) {
    const list = pantryByKey.get(ing.nameKey);
    if (!list?.length) continue;
    const pantry = list[0];
    const pantryQ = pantry.quantity_value != null
      ? (pantry.quantity_unit ? `${pantry.quantity_value} ${pantry.quantity_unit}` : String(pantry.quantity_value))
      : pantry.name;
    results.push({
      ingredientName: ing.name,
      recipeQuantityText: ing.quantityText,
      pantryId: pantry.id,
      pantryQuantityText: pantryQ,
      pantryLocation: pantry.location,
    });
  }
  return results;
}

/**
 * One pantry item update: new quantity_value after deducting recipe usage.
 * We only deduct when name and unit match; value is capped at 0.
 */
export interface PantryDeduction {
  pantryId: string;
  newQuantityValue: number | null;
}

/**
 * Compute how much to deduct from each pantry item for the given scaled recipe ingredients.
 * Matches by normalized name and same unit. Sums recipe amounts per (name, unit) then deducts once per pantry item; result capped at 0.
 */
export function computePantryDeductions(
  ingredients: RecipeIngredient[],
  pantryItems: PantryItemForMatch[],
  entryServings: number,
  recipeServings: number
): PantryDeduction[] {
  const scaled = scaleRecipeIngredients(ingredients, entryServings, recipeServings);
  const recipeTotalByKeyUnit = new Map<string, number>();
  for (const ing of scaled) {
    const u = unitKey(ing.unit);
    const mapKey = `${ing.nameKey}\n${u}`;
    const total = recipeTotalByKeyUnit.get(mapKey) ?? 0;
    recipeTotalByKeyUnit.set(mapKey, total + (ing.value ?? 0));
  }
  const pantryByKeyUnit = new Map<string, PantryItemForMatch>();
  for (const p of pantryItems) {
    const key = normalizeIngredientName(p.name);
    const u = unitKey(p.quantity_unit);
    const mapKey = `${key}\n${u}`;
    if (!pantryByKeyUnit.has(mapKey)) pantryByKeyUnit.set(mapKey, p);
  }
  const deductions: PantryDeduction[] = [];
  for (const [mapKey, toDeduct] of recipeTotalByKeyUnit) {
    if (toDeduct <= 0) continue;
    const pantry = pantryByKeyUnit.get(mapKey);
    if (!pantry || pantry.quantity_value == null) continue;
    const current = Number(pantry.quantity_value);
    deductions.push({
      pantryId: pantry.id,
      newQuantityValue: Math.max(0, current - toDeduct),
    });
  }
  return deductions;
}
