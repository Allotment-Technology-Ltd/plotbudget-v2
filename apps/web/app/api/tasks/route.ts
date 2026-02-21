import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { createTaskSchema, type CreateTaskInput } from '@repo/logic';
import type { InsertTables } from '@repo/supabase';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status');
  const assignedTo = searchParams.get('assigned_to');
  const projectId = searchParams.get('project_id');
  const dueBefore = searchParams.get('due_before');
  const dueAfter = searchParams.get('due_after');
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 1), 100);

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('household_id', householdId)
    .order('kanban_order', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (statusParam) {
    const statuses = statusParam.split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length > 0) query = query.in('status', statuses);
  }
  if (assignedTo && ['me', 'partner', 'both'].includes(assignedTo)) query = query.eq('assigned_to', assignedTo);
  if (projectId) query = query.eq('project_id', projectId);
  if (dueBefore) query = query.lte('due_date', dueBefore);
  if (dueAfter) query = query.gte('due_date', dueAfter);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to fetch tasks' }, { status: 500 });
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

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });

  const input: CreateTaskInput = parsed.data;
  const row: InsertTables<'tasks'> = {
    household_id: householdId,
    name: input.name,
    description: input.description ?? null,
    assigned_to: input.assigned_to ?? 'unassigned',
    status: input.status ?? 'todo',
    priority: input.priority ?? 'medium',
    due_date: input.due_date ?? null,
    project_id: input.project_id ?? null,
    phase_id: input.phase_id ?? null,
    routine_id: input.routine_id ?? null,
    effort_level: input.effort_level ?? 'medium',
    linked_module: input.linked_module ?? null,
    linked_entity_id: input.linked_entity_id ?? null,
    created_by: user.id,
  };

  const { data: created, error } = await supabase.from('tasks').insert(row as never).select().single();
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to create task' }, { status: 500 });
  const task = created as { id: string };
  await supabase.from('activity_feed').insert({
    household_id: householdId,
    actor_user_id: user.id,
    actor_type: 'user',
    action: 'created',
    object_name: input.name,
    object_detail: null,
    source_module: 'tasks',
    source_entity_id: task.id,
    action_url: `/dashboard/tasks?task=${task.id}`,
    metadata: {},
  } as never);

  return NextResponse.json(created as object);
}
