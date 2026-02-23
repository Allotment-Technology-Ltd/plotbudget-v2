import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { updateShoppingListSchema, type UpdateShoppingListInput } from '@repo/logic';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('id', id)
    .eq('household_id', householdId)
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Shopping list not found' }, { status: error?.code === 'PGRST116' ? 404 : 500 });
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

  const parsed = updateShoppingListSchema.safeParse({ ...(body as object), id });
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });

  const input: UpdateShoppingListInput = parsed.data;
  const { id: _id, ...rest } = input;
  void _id;
  const updates: Record<string, unknown> = { ...rest };

  // When marking done, record completed_at
  if (rest.status === 'done') {
    updates.completed_at = new Date().toISOString();
  } else if (rest.status === 'active') {
    updates.completed_at = null;
  }

  const { data: updated, error } = await supabase
    .from('shopping_lists')
    .update(updates as never)
    .eq('id', id)
    .eq('household_id', householdId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message ?? 'Failed to update shopping list' }, { status: 500 });
  if (!updated) return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
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
    .from('shopping_lists')
    .delete()
    .eq('id', id)
    .eq('household_id', householdId);

  if (error) return NextResponse.json({ error: error.message ?? 'Failed to delete shopping list' }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
