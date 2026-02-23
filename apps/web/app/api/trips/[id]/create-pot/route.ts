import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import type { InsertTables } from '@repo/supabase';
import { z } from 'zod';

const createPotSchema = z.object({
  target_amount: z.number().min(0.01),
  target_date: z.string().optional(),
  current_amount: z.number().min(0).optional(),
});

/**
 * POST /api/trips/[id]/create-pot
 * Creates a savings pot linked to this trip, or links an existing pot.
 * Body: { target_amount, target_date?, current_amount?, existing_pot_id? }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: tripId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Get the trip
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, name, currency, linked_pot_id')
    .eq('id', tripId)
    .eq('household_id', householdId)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }
  type TripResult = { id: string; name: string; currency: string };
  const tripData = trip as TripResult;
  // Check if using existing pot
  const bodyRecord = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const existingPotId = typeof bodyRecord.existing_pot_id === 'string' ? bodyRecord.existing_pot_id : null;

  if (existingPotId) {
    // Verify pot exists and belongs to household
    const { data: pot, error: potError } = await supabase
      .from('pots')
      .select('id')
      .eq('id', existingPotId)
      .eq('household_id', householdId)
      .single();

    if (potError || !pot) {
      return NextResponse.json({ error: 'Pot not found' }, { status: 404 });
    }

    // Link the pot to the trip
    const { error: updateError } = await supabase
      .from('trips')
      .update({ linked_pot_id: existingPotId } as never)
      .eq('id', tripId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, potId: existingPotId, linked: true });
  }

  // Validate input for creating new pot
  const parsed = createPotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { target_amount, target_date, current_amount = 0 } = parsed.data;

  // Create a new pot
  const potRow: InsertTables<'pots'> & { currency?: string } = {
    household_id: householdId,
    name: `${tripData.name} Fund`,
    current_amount,
    target_amount,
    target_date: target_date || null,
    status: 'active',
  };

  // If currency exists in DB, add it
  if (tripData.currency) {
    potRow.currency = tripData.currency;
  }

  const { data: newPot, error: createError } = await supabase
    .from('pots')
    .insert(potRow as never)
    .select('id')
    .single();

  if (createError || !newPot) {
    return NextResponse.json(
      { error: createError?.message || 'Failed to create pot' },
      { status: 400 }
    );
  }

  type PotResult = { id: string };
  const potData = newPot as PotResult;

  // Link the pot to the trip
  const { error: linkError } = await supabase
    .from('trips')
    .update({ linked_pot_id: potData.id } as never)
    .eq('id', tripId);

  if (linkError) {
    // Rollback: delete the pot if linking fails
    await supabase.from('pots').delete().eq('id', potData.id);
    return NextResponse.json({ error: linkError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, potId: potData.id, created: true });
}
