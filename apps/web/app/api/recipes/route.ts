import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { createRecipeSchema, type CreateRecipeInput } from '@repo/logic';
import type { InsertTables } from '@repo/supabase';

type RecipeRow = { id: string; name: string; ingredients: unknown; [key: string]: unknown };

/** Fuzzy match: recipe matches if its name or any ingredient contains *any* of the query words (not all required). */
function recipeMatchesSearch(recipe: RecipeRow, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const searchableName = recipe.name ?? '';
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const searchableIngredientNames = ingredients
    .map((item) => (typeof item === 'object' && item !== null && 'name' in item ? String((item as { name: string }).name) : ''))
    .filter(Boolean);
  const allSearchable = [searchableName, ...searchableIngredientNames].join(' ').toLowerCase();
  return words.some((w) => allSearchable.includes(w));
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 1), 100);
  const q = searchParams.get('q')?.trim() ?? '';

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('household_id', householdId)
    .order('name', { ascending: true })
    .limit(q ? 200 : limit);

  if (error) return NextResponse.json({ error: error.message ?? 'Failed to fetch recipes' }, { status: 500 });
  let list = (data ?? []) as RecipeRow[];
  if (q) {
    list = list.filter((r) => recipeMatchesSearch(r, q));
    list = list.slice(0, limit);
  }
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const parsed = createRecipeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });

  const input: CreateRecipeInput = parsed.data;
  const row: InsertTables<'recipes'> = {
    household_id: householdId,
    name: input.name,
    description: input.description ?? null,
    ingredients: (input.ingredients ?? []) as never,
    servings: input.servings ?? 1,
    source_url: input.source_url ?? null,
    instructions: input.instructions ?? null,
    image_url: input.image_url ?? null,
    prep_mins: input.prep_mins ?? null,
    cook_mins: input.cook_mins ?? null,
  };

  const { data: created, error } = await supabase.from('recipes').insert(row as never).select().single();
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to create recipe' }, { status: 500 });
  const recipe = created as { id: string };
  await supabase.from('activity_feed').insert({
    household_id: householdId,
    actor_user_id: user.id,
    actor_type: 'user',
    action: 'created',
    object_name: input.name,
    object_detail: null,
    source_module: 'meals',
    source_entity_id: recipe.id,
    action_url: `/dashboard/meals/recipes/${recipe.id}`,
    metadata: {},
  } as never);

  return NextResponse.json(created as object);
}
