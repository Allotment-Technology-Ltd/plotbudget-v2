import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { updateRoutineSchema, type UpdateRoutineInput } from '@repo/logic';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const parsed = updateRoutineSchema.safeParse({ ...(body as object), id });
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });

  const input: UpdateRoutineInput = parsed.data;
  const { id: _id, ...rest } = input;
  void _id;
  const { data: updated, error } = await supabase
    .from('routines')
    .update(rest as never)
    .eq('id', id)
    .eq('household_id', householdId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message ?? 'Failed to update routine' }, { status: 500 });
  if (!updated) return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data: updated, error } = await supabase
    .from('routines')
    .update({ is_active: false } as never)
    .eq('id', id)
    .eq('household_id', householdId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message ?? 'Failed to deactivate routine' }, { status: 500 });
  if (!updated) return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
  return NextResponse.json(updated);
}
