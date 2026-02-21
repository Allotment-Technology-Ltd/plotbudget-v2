import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';

/**
 * PATCH /api/tasks/[id]/complete
 * Toggle task completion state.
 * - completed=true  => status='done', completed_at=NOW()
 * - completed=false => status='todo', completed_at=NULL
 * If body is empty, it toggles based on current status.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) {
    return NextResponse.json(
      { error: 'No household found for user' },
      { status: 403 }
    );
  }

  let completed: boolean | null = null;
  try {
    const body = (await request.json()) as { completed?: unknown };
    if (typeof body.completed === 'boolean') {
      completed = body.completed;
    }
  } catch {
    // Empty/invalid body => default toggle behavior.
  }

  const { data: taskRow, error: fetchError } = await supabase
    .from('tasks')
    .select('id, name, status')
    .eq('id', id)
    .eq('household_id', householdId)
    .single();

  if (fetchError || !taskRow) {
    return NextResponse.json(
      { error: fetchError?.message ?? 'Task not found' },
      { status: fetchError?.code === 'PGRST116' ? 404 : 500 }
    );
  }

  const task = taskRow as { id: string; name: string; status: string };
  const willBeDone = completed ?? task.status !== 'done';
  const nextStatus = willBeDone ? 'done' : 'todo';
  const { data: updated, error } = await supabase
    .from('tasks')
    .update({
      status: nextStatus,
      completed_at: willBeDone ? new Date().toISOString() : null,
    } as never)
    .eq('id', id)
    .eq('household_id', householdId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to complete task' },
      { status: 500 }
    );
  }

  if (willBeDone && task.status !== 'done') {
    await supabase.from('activity_feed').insert({
      household_id: householdId,
      actor_user_id: user.id,
      actor_type: 'user',
      action: 'completed',
      object_name: task.name,
      object_detail: null,
      source_module: 'tasks',
      source_entity_id: id,
      action_url: `/dashboard/tasks?task=${id}`,
      metadata: {},
    } as never);
  }

  // Calm Design Rule 4: Do not notify partner of activity without explicit opt-in.
  // Partner can see completion in Activity on Home when they choose to look.
  // Re-add in-app/push notification here when we have notification_preferences.tasks.partner_activity opt-in.

  return NextResponse.json(updated);
}
