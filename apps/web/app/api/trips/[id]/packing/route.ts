import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { createPackingItemSchema, type CreatePackingItemInput, getPackingTemplate } from '@repo/logic';
import type { InsertTables } from '@repo/supabase';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data, error } = await supabase
    .from('packing_items')
    .select('*')
    .eq('trip_id', tripId)
    .eq('household_id', householdId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message ?? 'Failed to fetch packing items' }, { status: 500 });
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

  // Check for packing template seeding: POST /api/trips/[id]/packing?template=beach
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('template');
  if (templateId) {
    const template = getPackingTemplate(templateId);
    if (!template) return NextResponse.json({ error: `Unknown packing template: ${templateId}` }, { status: 400 });

    const rows: InsertTables<'packing_items'>[] = template.items.map((item, index) => ({
      trip_id: tripId,
      household_id: householdId,
      name: item.name,
      category: item.category,
      is_packed: false,
      assignee: 'shared',
      sort_order: index,
    }));

    try {
      const { data: created, error } = await supabase.from('packing_items').insert(rows as never).select();
      if (error) return NextResponse.json({ error: 'Failed to seed packing template' }, { status: 500 });
      return NextResponse.json(created as object[], { status: 201 });
    } catch {
      return NextResponse.json({ error: 'Failed to seed packing template' }, { status: 500 });
    }
  }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const parsed = createPackingItemSchema.safeParse({ ...(body as object), trip_id: tripId });
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });

  const input: CreatePackingItemInput = parsed.data;
  const row: InsertTables<'packing_items'> = {
    trip_id: tripId,
    household_id: householdId,
    category: input.category ?? null,
    name: input.name,
    is_packed: input.is_packed ?? false,
    assignee: input.assignee ?? 'shared',
    sort_order: input.sort_order ?? 0,
  };

  try {
    const { data: created, error } = await supabase.from('packing_items').insert(row as never).select().single();
    if (error) return NextResponse.json({ error: 'Failed to create packing item' }, { status: 500 });
    return NextResponse.json(created as object, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create packing item' }, { status: 500 });
  }
}
