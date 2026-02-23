import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { updateProjectSchema, type UpdateProjectInput } from '@repo/logic';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('household_id', householdId)
    .single();

  if (projectError || !project) return NextResponse.json({ error: projectError?.message ?? 'Project not found' }, { status: projectError?.code === 'PGRST116' ? 404 : 500 });

  const { data: phases } = await supabase.from('project_phases').select('*').eq('project_id', id).order('sort_order', { ascending: true });
  const { data: tasks } = await supabase.from('tasks').select('*').eq('project_id', id).order('kanban_order', { ascending: true });

  return NextResponse.json({ ...(project as Record<string, unknown>), phases: phases ?? [], tasks: tasks ?? [] });
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

  const parsed = updateProjectSchema.safeParse({ ...(body as Record<string, unknown>), id });
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });

  const input: UpdateProjectInput = parsed.data;
  const { id: _id, ...rest } = input;
  void _id;
  const updates = rest as Record<string, unknown>;
  const { data: updated, error } = await supabase
    .from('projects')
    .update(updates as never)
    .eq('id', id)
    .eq('household_id', householdId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message ?? 'Failed to update project' }, { status: 500 });
  if (!updated) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { error } = await supabase.from('projects').delete().eq('id', id).eq('household_id', householdId);
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to delete project' }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
