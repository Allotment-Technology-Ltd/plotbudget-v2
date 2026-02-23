import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';

/**
 * PATCH /api/trips/[id]/budget/[itemId]/sync-cost
 * Synchronizes the cost between a budget item and its linked itinerary entry.
 * Direction: budget item → itinerary entry (budget is source of truth)
 */
export async function PATCH(
  _request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: tripId, itemId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  // Fetch budget item with its linked itinerary entry
  const { data: budgetItem, error: fetchError } = await supabase
    .from('trip_budget_items')
    .select('id, planned_amount, currency, itinerary_entry_id')
    .eq('id', itemId)
    .eq('trip_id', tripId)
    .eq('household_id', householdId)
    .single();

  if (fetchError || !budgetItem) {
    return NextResponse.json({ error: 'Budget item not found' }, { status: 404 });
  }

  const item = budgetItem as {
    id: string;
    planned_amount: number;
    currency: string;
    itinerary_entry_id: string | null;
  };

  // If not linked to an itinerary entry, nothing to sync
  if (!item.itinerary_entry_id) {
    return NextResponse.json({
      success: true,
      message: 'No linked itinerary entry to sync',
    });
  }

  // Update the linked itinerary entry's cost to match budget item
  const { error: updateError } = await supabase
    .from('itinerary_entries')
    .update({
      cost_amount: item.planned_amount,
      cost_currency: item.currency,
    } as never)
    .eq('id', item.itinerary_entry_id)
    .eq('household_id', householdId);

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to sync cost to itinerary entry' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Cost synced to itinerary entry',
  });
}
