import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { createTripSchema, type CreateTripInput, getPackingTemplate, getBudgetTemplate, getItineraryTemplate } from '@repo/logic';
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
  const tripType = (body as { trip_type?: string }).trip_type;
  
  const row: InsertTables<'trips'> = {
    household_id: householdId,
    name: input.name,
    destination: input.destination,
    start_date: input.start_date,
    end_date: input.end_date,
    status: input.status ?? 'planning',
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
    const created = data as { id: string; name: string; start_date: string; currency: string };

    // Apply templates if trip_type is provided
    if (tripType && ['beach', 'city', 'skiing', 'winter-city', 'camping', 'business'].includes(tripType)) {
      try {
        // Apply packing template
        const packingTemplate = getPackingTemplate(tripType);
        if (packingTemplate) {
          const packingItems = packingTemplate.items.map((item, index) => ({
            trip_id: created.id,
            household_id: householdId,
            name: item.name,
            category: item.category.toLowerCase(),
            is_packed: false,
            assignee: 'shared' as const,
            sort_order: index,
          }));
          await supabase.from('packing_items').insert(packingItems as never);
        }

        // Apply itinerary template
        const itineraryTemplate = getItineraryTemplate(tripType);
        if (itineraryTemplate) {
          const startDate = new Date(created.start_date);
          const itineraryEntries = itineraryTemplate.items.map((item, index) => {
            const entryDate = new Date(startDate);
            entryDate.setDate(startDate.getDate() + item.day_offset);
            return {
              trip_id: created.id,
              household_id: householdId,
              date: entryDate.toISOString().split('T')[0],
              title: item.title,
              entry_type: item.entry_type,
              start_time: item.start_time ?? null,
              end_time: item.end_time ?? null,
              description: item.description ?? null,
              cost_amount: item.cost_amount ?? null,
              cost_currency: item.cost_amount ? created.currency : null,
              sort_order: index,
            };
          });
          await supabase.from('itinerary_entries').insert(itineraryEntries as never);
        }

        // Apply budget template
        const budgetTemplate = getBudgetTemplate(tripType);
        if (budgetTemplate) {
          const budgetItems = budgetTemplate.items.map((item) => ({
            trip_id: created.id,
            household_id: householdId,
            category: item.category,
            name: item.name,
            planned_amount: item.planned_amount,
            currency: created.currency,
          }));
          await supabase.from('trip_budget_items').insert(budgetItems as never);
        }
      } catch (templateError) {
        console.error('[POST /api/trips] template application error:', templateError);
        // Continue anyway - trip is created, templates are optional
      }
    }

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
