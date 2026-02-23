import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import type { InsertTables } from '@repo/supabase';

/**
 * POST /api/trips/[id]/budget/[itemId]/add-to-cycle
 * Adds a budget item to the appropriate cycle as a "want" seed based on due date.
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: tripId, itemId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  // Get the budget item
  const { data: budgetItem, error: budgetError } = await supabase
    .from('trip_budget_items')
    .select('*, trips!inner(name, currency)')
    .eq('id', itemId)
    .eq('trip_id', tripId)
    .eq('household_id', householdId)
    .single();

  if (budgetError || !budgetItem) {
    return NextResponse.json({ error: 'Budget item not found' }, { status: 404 });
  }

  type BudgetItemWithTrip = {
    id: string;
    name: string;
    category: string;
    planned_amount: number;
    actual_amount: number | null;
    due_date: string | null;
    trips: { name: string; currency: string };
  };
  const item = budgetItem as BudgetItemWithTrip;

  if (!item.due_date) {
    return NextResponse.json(
      { error: 'Budget item must have a due date to add to cycle' },
      { status: 400 }
    );
  }

  // Find the cycle that contains this due date
  const { data: cycles } = await supabase
    .from('paycycles')
    .select('id, start_date, end_date')
    .eq('household_id', householdId)
    .lte('start_date', item.due_date)
    .gte('end_date', item.due_date)
    .order('start_date', { ascending: false })
    .limit(1);

  if (!cycles || cycles.length === 0) {
    return NextResponse.json(
      {
        error: `No cycle found for due date ${item.due_date}. Create a cycle that includes this date first.`,
      },
      { status: 400 }
    );
  }

  type PaycycleResult = { id: string; start_date: string; end_date: string };
  const cycle = cycles[0] as PaycycleResult;

  // Check if already added to this cycle
  const { data: existingSeed } = await supabase
    .from('seeds')
    .select('id')
    .eq('trip_budget_item_id', itemId)
    .eq('paycycle_id', cycle.id)
    .single();

  if (existingSeed) {
    return NextResponse.json(
      { error: 'Budget item already added to this cycle' },
      { status: 400 }
    );
  }

  // Create the seed as a "want"
  const amount = item.planned_amount || item.actual_amount || 0;
  const trip = item.trips;

  const seedRow: InsertTables<'seeds'> = {
    household_id: householdId,
    paycycle_id: cycle.id,
    name: `${trip.name} - ${item.name}`,
    amount,
    type: 'want',
    category: item.category,
    payment_source: 'me',
    due_date: item.due_date,
    is_recurring: false,
  } as any; // trip_budget_item_id added via migration, not yet in generated types

  // @ts-expect-error - trip_budget_item_id exists in DB via migration
  seedRow.trip_budget_item_id = itemId;

  const { error: insertError } = await supabase.from('seeds').insert(seedRow as never);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    cycleId: cycle.id,
    message: `Added to cycle ${cycle.start_date} - ${cycle.end_date}`,
  });
}
