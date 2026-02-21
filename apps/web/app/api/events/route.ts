import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { createEventSchema, type CreateEventInput } from '@repo/logic';
import type { InsertTables } from '@repo/supabase';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  let query = supabase
    .from('events')
    .select('*')
    .eq('household_id', householdId)
    .order('start_at', { ascending: true });

  if (startParam) query = query.gte('start_at', startParam);
  if (endParam) query = query.lte('start_at', endParam);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to fetch events' }, { status: 500 });
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

  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });

  const input: CreateEventInput = parsed.data;
  const row: InsertTables<'events'> = {
    household_id: householdId,
    title: input.title,
    description: input.description ?? null,
    start_at: input.start_at,
    end_at: input.end_at ?? null,
    all_day: input.all_day ?? false,
    recurrence_rule: input.recurrence_rule ?? null,
    source_module: input.source_module ?? null,
    source_entity_id: input.source_entity_id ?? null,
  };

  const { data: created, error } = await supabase.from('events').insert(row as never).select().single();
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to create event' }, { status: 500 });
  return NextResponse.json(created);
}
