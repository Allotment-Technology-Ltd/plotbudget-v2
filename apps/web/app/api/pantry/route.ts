import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { createPantryItemSchema, type CreatePantryItemInput } from '@repo/logic';
import type { InsertTables } from '@repo/supabase';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location')?.trim();
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '200', 10) || 200, 1), 500);

  let query = supabase
    .from('pantry_items')
    .select('*')
    .eq('household_id', householdId)
    .order('location', { ascending: true })
    .order('name', { ascending: true })
    .limit(limit);

  if (location && location.length > 0) {
    query = query.eq('location', location);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to fetch pantry' }, { status: 500 });
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

  const parsed = createPantryItemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });

  const input: CreatePantryItemInput = parsed.data;
  const row: InsertTables<'pantry_items'> = {
    household_id: householdId,
    name: input.name.trim(),
    quantity_value: input.quantity_value ?? null,
    quantity_unit: input.quantity_unit ?? null,
    location: (input.location ?? 'pantry').trim(),
    notes: input.notes ?? null,
  };

  const { data: created, error } = await supabase.from('pantry_items').insert(row as never).select().single();
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to create pantry item' }, { status: 500 });
  return NextResponse.json(created as object);
}
