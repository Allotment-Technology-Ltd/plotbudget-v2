import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';

/**
 * PATCH /api/tasks/[id]/complete
 * Mark task as done (status = 'done', completed_at = NOW()). Create activity + optional notification for partner.
 */
export async function PATCH(
  _request: NextRequest,
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

  const { data: taskRow, error: fetchError } = await supabase
    .from('tasks')
    .select('id, name, assigned_to')
    .eq('id', id)
    .eq('household_id', householdId)
    .single();

  if (fetchError || !taskRow) {
    return NextResponse.json(
      { error: fetchError?.message ?? 'Task not found' },
      { status: fetchError?.code === 'PGRST116' ? 404 : 500 }
    );
  }

  const task = taskRow as { id: string; name: string; assigned_to: string };
  const { data: updated, error } = await supabase
    .from('tasks')
    .update({
      status: 'done',
      completed_at: new Date().toISOString(),
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

  // Calm Design Rule 4: Do not notify partner of activity without explicit opt-in.
  // Partner can see completion in Activity on Home when they choose to look.
  // Re-add in-app/push notification here when we have notification_preferences.tasks.partner_activity opt-in.

  return NextResponse.json(updated);
}
