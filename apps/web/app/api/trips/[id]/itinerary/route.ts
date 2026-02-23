import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { createItineraryEntrySchema, type CreateItineraryEntryInput } from '@repo/logic';
import type { InsertTables } from '@repo/supabase';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data, error } = await supabase
    .from('itinerary_entries')
    .select('*')
    .eq('trip_id', tripId)
    .eq('household_id', householdId)
    .order('date', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message ?? 'Failed to fetch itinerary' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  // Verify trip belongs to this household
  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', tripId)
    .eq('household_id', householdId)
    .single();
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const parsed = createItineraryEntrySchema.safeParse({ ...(body as object), trip_id: tripId });
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });

  const input: CreateItineraryEntryInput = parsed.data;
  const row: InsertTables<'itinerary_entries'> = {
    trip_id: tripId,
    household_id: householdId,
    date: input.date,
    title: input.title,
    description: input.description ?? null,
    start_time: input.start_time ?? null,
    end_time: input.end_time ?? null,
    entry_type: input.entry_type ?? 'other',
    booking_ref: input.booking_ref ?? null,
    booking_url: input.booking_url ?? null,
    cost_amount: input.cost_amount ?? null,
    cost_currency: input.cost_currency ?? null,
    sort_order: input.sort_order ?? 0,
  };

  try {
    const { data: created, error } = await supabase.from('itinerary_entries').insert(row as never).select().single();
    if (error) return NextResponse.json({ error: 'Failed to create itinerary entry' }, { status: 500 });

    await supabase.from('activity_feed').insert({
      household_id: householdId,
      actor_user_id: user.id,
      actor_type: 'user',
      action: 'created',
      object_name: input.title,
      object_detail: input.date,
      source_module: 'holidays',
      source_entity_id: tripId,
      action_url: `/dashboard/holidays/${tripId}`,
      metadata: {},
    } as never);

    return NextResponse.json(created as object, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create itinerary entry' }, { status: 500 });
  }
}
