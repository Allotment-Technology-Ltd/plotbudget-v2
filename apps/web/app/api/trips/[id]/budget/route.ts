import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { createTripBudgetItemSchema, type CreateTripBudgetItemInput, getBudgetTemplate } from '@repo/logic';
import type { InsertTables } from '@repo/supabase';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data, error } = await supabase
    .from('trip_budget_items')
    .select('*')
    .eq('trip_id', tripId)
    .eq('household_id', householdId)
    .order('category', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message ?? 'Failed to fetch budget items' }, { status: 500 });
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
    .select('id, currency')
    .eq('id', tripId)
    .eq('household_id', householdId)
    .single();
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

  // Check for budget template seeding: POST /api/trips/[id]/budget?template=beach
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('template');
  if (templateId) {
    const template = getBudgetTemplate(templateId);
    if (!template) return NextResponse.json({ error: `Unknown budget template: ${templateId}` }, { status: 400 });

    const tripRow = trip as { currency: string };
    const rows: InsertTables<'trip_budget_items'>[] = template.items.map((item) => ({
      trip_id: tripId,
      household_id: householdId,
      category: item.category,
      name: item.name,
      planned_amount: item.planned_amount,
      actual_amount: null,
      currency: tripRow.currency ?? 'GBP',
      booking_ref: null,
      itinerary_entry_id: null,
    }));

    try {
      const { data: created, error } = await supabase.from('trip_budget_items').insert(rows as never).select();
      if (error) return NextResponse.json({ error: 'Failed to seed budget template' }, { status: 500 });
      return NextResponse.json(created as object[], { status: 201 });
    } catch {
      return NextResponse.json({ error: 'Failed to seed budget template' }, { status: 500 });
    }
  }

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const parsed = createTripBudgetItemSchema.safeParse({ ...(body as object), trip_id: tripId });
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });

  const input: CreateTripBudgetItemInput = parsed.data;
  const tripRow = trip as { currency: string };
  const row: InsertTables<'trip_budget_items'> = {
    trip_id: tripId,
    household_id: householdId,
    category: input.category ?? 'other',
    name: input.name,
    planned_amount: input.planned_amount,
    actual_amount: input.actual_amount ?? null,
    currency: input.currency ?? tripRow.currency ?? 'GBP',
    booking_ref: input.booking_ref ?? null,
    itinerary_entry_id: input.itinerary_entry_id ?? null,
  };

  try {
    const { data: created, error } = await supabase.from('trip_budget_items').insert(row as never).select().single();
    if (error) return NextResponse.json({ error: 'Failed to create budget item' }, { status: 500 });
    return NextResponse.json(created as object, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create budget item' }, { status: 500 });
  }
}
