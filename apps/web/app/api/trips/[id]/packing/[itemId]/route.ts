import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { updatePackingItemSchema, type UpdatePackingItemInput } from '@repo/logic';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: tripId, itemId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const parsed = updatePackingItemSchema.safeParse({ ...(body as object), id: itemId });
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });

  const input: UpdatePackingItemInput = parsed.data;
  const { id: _id, ...updates } = input;

  try {
    const { data: updated, error } = await supabase
      .from('packing_items')
      .update(updates as never)
      .eq('id', itemId)
      .eq('trip_id', tripId)
      .eq('household_id', householdId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to update packing item' }, { status: 500 });
    if (!updated) return NextResponse.json({ error: 'Packing item not found' }, { status: 404 });
    return NextResponse.json(updated as object);
  } catch {
    return NextResponse.json({ error: 'Failed to update packing item' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: tripId, itemId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  try {
    const { error } = await supabase
      .from('packing_items')
      .delete()
      .eq('id', itemId)
      .eq('trip_id', tripId)
      .eq('household_id', householdId);

    if (error) return NextResponse.json({ error: 'Failed to delete packing item' }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete packing item' }, { status: 500 });
  }
}
