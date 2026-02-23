import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { updateMealPlanEntrySchema, type UpdateMealPlanEntryInput } from '@repo/logic';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data, error } = await supabase
    .from('meal_plan_entries')
    .select('*, recipe:recipes(*)')
    .eq('id', id)
    .eq('household_id', householdId)
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Meal plan entry not found' }, { status: error?.code === 'PGRST116' ? 404 : 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const parsed = updateMealPlanEntrySchema.safeParse({ ...(body as object), id });
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });

  const input: UpdateMealPlanEntryInput = parsed.data;
  const { id: _id, ...rest } = input;
  void _id;
  const updates: Record<string, unknown> = { ...rest };
  if (rest.free_text !== undefined) updates.free_text = rest.free_text?.trim() || null;
  if (rest.meal_slot !== undefined) updates.meal_slot = rest.meal_slot;
  if (rest.is_batch_cook !== undefined) updates.is_batch_cook = rest.is_batch_cook;
  if (rest.leftovers_from_meal_plan_entry_id !== undefined) updates.leftovers_from_meal_plan_entry_id = rest.leftovers_from_meal_plan_entry_id ?? null;

  const { data: updated, error } = await supabase
    .from('meal_plan_entries')
    .update(updates as never)
    .eq('id', id)
    .eq('household_id', householdId)
    .select('*, recipe:recipes(*)')
    .single();

  if (error) return NextResponse.json({ error: error.message ?? 'Failed to update meal plan entry' }, { status: 500 });
  if (!updated) return NextResponse.json({ error: 'Meal plan entry not found' }, { status: 404 });
  return NextResponse.json(updated as object);
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { error } = await supabase
    .from('meal_plan_entries')
    .delete()
    .eq('id', id)
    .eq('household_id', householdId);

  if (error) return NextResponse.json({ error: error.message ?? 'Failed to delete meal plan entry' }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
