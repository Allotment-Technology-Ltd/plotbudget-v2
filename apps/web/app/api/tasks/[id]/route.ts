import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { updateTaskSchema, type UpdateTaskInput } from '@repo/logic';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('household_id', householdId)
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Task not found' }, { status: error?.code === 'PGRST116' ? 404 : 500 });
  return NextResponse.json(data);
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

  const parsed = updateTaskSchema.safeParse({ ...(body as object), id });
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });

  const input: UpdateTaskInput = parsed.data;
  const { id: _id, ...rest } = input;
  const updates: Record<string, unknown> = { ...rest };
  if (updates.status === 'done') updates.completed_at = new Date().toISOString();
  if (updates.status && updates.status !== 'done') updates.completed_at = null;

  const { data: updated, error } = await supabase
    .from('tasks')
    .update(updates as never)
    .eq('id', id)
    .eq('household_id', householdId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message ?? 'Failed to update task' }, { status: 500 });
  if (!updated) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  const taskRow = updated as { id: string; name: string };
  if (updates.status === 'done') {
    await supabase.from('activity_feed').insert({
      household_id: householdId,
      actor_user_id: user.id,
      actor_type: 'user',
      action: 'completed',
      object_name: taskRow.name,
      object_detail: null,
      source_module: 'tasks',
      source_entity_id: taskRow.id,
      action_url: `/dashboard/tasks?task=${taskRow.id}`,
      metadata: {},
    } as never);
  }

  return NextResponse.json(updated as object);
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data: task } = await supabase.from('tasks').select('name').eq('id', id).eq('household_id', householdId).single();
  const { error } = await supabase.from('tasks').delete().eq('id', id).eq('household_id', householdId);

  if (error) return NextResponse.json({ error: error.message ?? 'Failed to delete task' }, { status: 500 });
  const deletedTask = task as { name: string } | null;
  if (deletedTask) {
    await supabase.from('activity_feed').insert({
      household_id: householdId,
      actor_user_id: user.id,
      actor_type: 'user',
      action: 'deleted',
      object_name: deletedTask.name,
      object_detail: null,
      source_module: 'tasks',
      source_entity_id: id,
      action_url: null,
      metadata: {},
    } as never);
  }
  return new NextResponse(null, { status: 204 });
}
