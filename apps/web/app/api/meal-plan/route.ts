import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { createMealPlanEntrySchema, type CreateMealPlanEntryInput } from '@repo/logic';
import type { InsertTables } from '@repo/supabase';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 1), 100);

  let query = supabase
    .from('meal_plan_entries')
    .select('*, recipe:recipes(*)')
    .eq('household_id', householdId)
    .order('planned_date', { ascending: true })
    .order('sort_order', { ascending: true })
    .limit(limit);

  if (fromDate) query = query.gte('planned_date', fromDate);
  if (toDate) query = query.lte('planned_date', toDate);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to fetch meal plan' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const parsed = createMealPlanEntrySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });

  const input: CreateMealPlanEntryInput = parsed.data;
  const freeText = input.free_text?.trim() || null;
  const row: InsertTables<'meal_plan_entries'> = {
    household_id: householdId,
    recipe_id: input.recipe_id ?? null,
    free_text: freeText,
    planned_date: input.planned_date,
    servings: input.servings ?? null,
    sort_order: input.sort_order ?? 0,
    meal_slot: input.meal_slot ?? 'dinner',
    is_batch_cook: input.is_batch_cook ?? false,
    leftovers_from_meal_plan_entry_id: input.leftovers_from_meal_plan_entry_id ?? null,
  };

  const { data: created, error } = await supabase.from('meal_plan_entries').insert(row as never).select('*, recipe:recipes(*)').single();
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to create meal plan entry' }, { status: 500 });
  return NextResponse.json(created as object);
}
