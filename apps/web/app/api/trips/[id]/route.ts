import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { updateTripSchema, type UpdateTripInput } from '@repo/logic';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .eq('household_id', householdId)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
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

  const parsed = updateTripSchema.safeParse({ ...(body as object), id });
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });

  const input: UpdateTripInput = parsed.data;
  const { id: _id, ...updates } = input;

  try {
    const { data: updated, error } = await supabase
      .from('trips')
      .update(updates as never)
      .eq('id', id)
      .eq('household_id', householdId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 });
    if (!updated) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    return NextResponse.json(updated as object);
  } catch {
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data: trip } = await supabase
    .from('trips')
    .select('name, destination')
    .eq('id', id)
    .eq('household_id', householdId)
    .single();

  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

  try {
    const { error } = await supabase.from('trips').delete().eq('id', id).eq('household_id', householdId);
    if (error) return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 });
  } catch {
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 });
  }

  const deletedTrip = trip as { name: string; destination: string };
  await supabase.from('activity_feed').insert({
    household_id: householdId,
    actor_user_id: user.id,
    actor_type: 'user',
    action: 'deleted',
    object_name: deletedTrip.name,
    object_detail: deletedTrip.destination,
    source_module: 'holidays',
    source_entity_id: id,
    action_url: null,
    metadata: {},
  } as never);

  return new NextResponse(null, { status: 204 });
}
