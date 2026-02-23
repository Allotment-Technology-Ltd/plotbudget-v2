import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { updatePantryItemSchema, type UpdatePantryItemInput } from '@repo/logic';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('id', id)
    .eq('household_id', householdId)
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Pantry item not found' }, { status: error?.code === 'PGRST116' ? 404 : 500 });
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

  const parsed = updatePantryItemSchema.safeParse({ ...(body as object), id });
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });

  const input: UpdatePantryItemInput = parsed.data;
  const { id: _id, ...rest } = input;
  void _id;
  const updates: Record<string, unknown> = { ...rest };
  if (rest.name !== undefined) updates.name = rest.name.trim();
  if (rest.location !== undefined) updates.location = rest.location.trim();

  const { data: updated, error } = await supabase
    .from('pantry_items')
    .update(updates as never)
    .eq('id', id)
    .eq('household_id', householdId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message ?? 'Failed to update pantry item' }, { status: 500 });
  if (!updated) return NextResponse.json({ error: 'Pantry item not found' }, { status: 404 });
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
    .from('pantry_items')
    .delete()
    .eq('id', id)
    .eq('household_id', householdId);

  if (error) return NextResponse.json({ error: error.message ?? 'Failed to delete pantry item' }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
