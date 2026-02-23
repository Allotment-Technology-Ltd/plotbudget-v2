import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { updateEventSchema, type UpdateEventInput } from '@repo/logic';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('household_id', householdId)
    .single();

  if (error || !event) return NextResponse.json({ error: error?.message ?? 'Event not found' }, { status: error?.code === 'PGRST116' ? 404 : 500 });
  return NextResponse.json(event);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const parsed = updateEventSchema.safeParse({ ...(body as Record<string, unknown>), id });
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });

  const input: UpdateEventInput = parsed.data;
  const { id: _id, ...rest } = input;
  void _id;
  const updates = rest as Record<string, unknown>;

  const { data: updated, error } = await supabase
    .from('events')
    .update(updates as never)
    .eq('id', id)
    .eq('household_id', householdId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message ?? 'Failed to update event' }, { status: 500 });
  if (!updated) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { error } = await supabase.from('events').delete().eq('id', id).eq('household_id', householdId);
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to delete event' }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
