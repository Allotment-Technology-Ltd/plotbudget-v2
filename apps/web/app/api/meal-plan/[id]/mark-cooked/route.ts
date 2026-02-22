import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { computePantryDeductions } from '@repo/logic';
import type { RecipeIngredient } from '@repo/logic';

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data: entry, error: entryError } = await supabase
    .from('meal_plan_entries')
    .select('id, recipe_id, servings, cooked_at, recipe:recipes(id, ingredients, servings)')
    .eq('id', id)
    .eq('household_id', householdId)
    .single();

  if (entryError || !entry) return NextResponse.json({ error: 'Meal plan entry not found' }, { status: 404 });
  if ((entry as { cooked_at: string | null }).cooked_at) {
    return NextResponse.json({ error: 'Meal already marked as cooked' }, { status: 400 });
  }
  const recipe = (entry as { recipe?: { id: string; ingredients: unknown; servings: number } | null }).recipe;
  if (!recipe?.id || !Array.isArray(recipe.ingredients)) {
    return NextResponse.json({ error: 'Entry has no recipe with ingredients; nothing to deduct' }, { status: 400 });
  }

  const ingredients = recipe.ingredients as RecipeIngredient[];
  const entryServings = (entry as { servings: number | null }).servings ?? recipe.servings ?? 1;
  const recipeServings = recipe.servings ?? 1;

  type PantryRow = { id: string; name: string; quantity_value: number | null; quantity_unit: string | null; location: string };
  const { data: pantryRows, error: pantryError } = await supabase
    .from('pantry_items')
    .select('id, name, quantity_value, quantity_unit, location')
    .eq('household_id', householdId);
  if (pantryError) return NextResponse.json({ error: pantryError.message ?? 'Failed to fetch pantry' }, { status: 500 });
  const pantryItems: PantryRow[] = (pantryRows as PantryRow[] | null) ?? [];
  const pantryItemsForDeduction = pantryItems.map((p) => ({
    id: p.id,
    name: p.name,
    quantity_value: p.quantity_value,
    quantity_unit: p.quantity_unit,
    location: p.location,
  }));

  const deductions = computePantryDeductions(ingredients, pantryItemsForDeduction, entryServings, recipeServings);

  const cookedAt = new Date().toISOString();
  const { error: updateEntryError } = await supabase
    .from('meal_plan_entries')
    .update({ cooked_at: cookedAt } as never)
    .eq('id', id)
    .eq('household_id', householdId);
  if (updateEntryError) return NextResponse.json({ error: updateEntryError.message ?? 'Failed to mark as cooked' }, { status: 500 });

  for (const d of deductions) {
    await supabase
      .from('pantry_items')
      .update({ quantity_value: d.newQuantityValue } as never)
      .eq('id', d.pantryId)
      .eq('household_id', householdId);
  }

  return NextResponse.json({
    cooked_at: cookedAt,
    pantry_updated: deductions.length,
  });
}
