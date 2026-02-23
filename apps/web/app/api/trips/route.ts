import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { createTripSchema, type CreateTripInput } from '@repo/logic';
import type { InsertTables } from '@repo/supabase';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('trips')
    .select('id, name, destination, start_date, end_date, status, currency, linked_pot_id, linked_project_id, cover_image_url, created_at, updated_at')
    .eq('household_id', householdId)
    .order('start_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to fetch trips' }, { status: 500 });
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

  const parsed = createTripSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });

  const input: CreateTripInput = parsed.data;
  const row: InsertTables<'trips'> = {
    household_id: householdId,
    name: input.name,
    destination: input.destination,
    start_date: input.start_date,
    end_date: input.end_date,
    status: input.status ?? 'draft',
    linked_pot_id: input.linked_pot_id ?? null,
    linked_project_id: input.linked_project_id ?? null,
    currency: input.currency ?? 'GBP',
    notes: input.notes ?? null,
    cover_image_url: input.cover_image_url ?? null,
  };

  try {
    const { data, error } = await supabase.from('trips').insert(row as never).select().single();
    if (error || !data) {
      console.error('[POST /api/trips] insert error:', error);
      return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
    }
    const created = data as { id: string; name: string };

    await supabase.from('activity_feed').insert({
      household_id: householdId,
      actor_user_id: user.id,
      actor_type: 'user',
      action: 'created',
      object_name: input.name,
      object_detail: input.destination,
      source_module: 'holidays',
      source_entity_id: created.id,
      action_url: `/dashboard/holidays/${created.id}`,
      metadata: {},
    } as never);

    return NextResponse.json(data as object, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
