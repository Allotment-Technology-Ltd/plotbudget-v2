import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { matchRecipeIngredientsToPantry } from '@repo/logic';
import type { RecipeIngredient } from '@repo/logic';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const b = body as Record<string, unknown>;
  const recipeId = b.recipeId;
  const ingredients = b.ingredients;
  const entryServings = typeof b.entryServings === 'number' ? b.entryServings : 1;
  const recipeServings = typeof b.recipeServings === 'number' ? b.recipeServings : 1;

  let list: RecipeIngredient[];
  let recipeServingsUsed = recipeServings;

  const hasRecipeId = typeof recipeId === 'string' && recipeId.length > 0;
  const hasIngredients = Array.isArray(ingredients) && ingredients.every((i: unknown) => typeof i === 'object' && i != null && typeof (i as { name?: unknown }).name === 'string');
  if (hasRecipeId && !hasIngredients) {
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id, ingredients, servings')
      .eq('id', recipeId)
      .eq('household_id', householdId)
      .single();
    if (recipeError || !recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    const ing = (recipe as { ingredients?: unknown }).ingredients;
    list = Array.isArray(ing) ? (ing as RecipeIngredient[]) : [];
    recipeServingsUsed = (recipe as { servings?: number }).servings ?? 1;
  } else if (hasIngredients && Array.isArray(ingredients)) {
    list = ingredients as RecipeIngredient[];
  } else {
    return NextResponse.json({ error: 'Provide recipeId or ingredients array' }, { status: 400 });
  }

  type PantryRow = { id: string; name: string; quantity_value: number | null; quantity_unit: string | null; location: string };
  const { data: pantryRows, error: pantryError } = await supabase
    .from('pantry_items')
    .select('id, name, quantity_value, quantity_unit, location')
    .eq('household_id', householdId);
  if (pantryError) return NextResponse.json({ error: pantryError.message ?? 'Failed to fetch pantry' }, { status: 500 });
  const rows = (pantryRows as PantryRow[] | null) ?? [];
  const pantryItems = rows.map((p) => ({
    id: p.id,
    name: p.name,
    quantity_value: p.quantity_value,
    quantity_unit: p.quantity_unit,
    location: p.location,
  }));

  const matches = matchRecipeIngredientsToPantry(list, pantryItems, entryServings, recipeServingsUsed);
  return NextResponse.json({ matches });
}
