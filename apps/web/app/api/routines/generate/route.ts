import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { generateTasksFromRoutines } from '@repo/logic';
import type { RoutineRow, TaskRow } from '@repo/logic';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const dateStr = typeof body.date === 'string' ? body.date : new Date().toISOString().slice(0, 10);
  const targetDate = new Date(dateStr);

  const { data: routines } = await supabase
    .from('routines')
    .select('id, household_id, name, frequency, day_of_week, assignment_mode, effort_level, last_generated_for, is_active')
    .eq('household_id', householdId)
    .eq('is_active', true);

  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('id, routine_id, due_date, created_at, assigned_to, status')
    .eq('household_id', householdId);

  const inserts = generateTasksFromRoutines(
    (routines ?? []) as RoutineRow[],
    (existingTasks ?? []) as TaskRow[],
    targetDate
  );

  if (inserts.length === 0) return NextResponse.json({ count: 0, message: 'No new tasks to generate' });

  const { data: inserted, error } = await supabase.from('tasks').insert(inserts as never).select('id');
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to insert generated tasks' }, { status: 500 });

  const rows = (inserted ?? []) as { id: string }[];
  const count = rows.length;
  const routineIds = [...new Set(inserts.map((i) => i.routine_id))];
  if (routineIds.length > 0) {
    await supabase.from('routines').update({ last_generated_for: dateStr } as never).eq('household_id', householdId).in('id', routineIds);
  }

  return NextResponse.json({ count, taskIds: rows.map((t) => t.id) });
}
