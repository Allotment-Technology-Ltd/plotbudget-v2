import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { createProjectSchema, type CreateProjectInput } from '@repo/logic';
import type { InsertTables } from '@repo/supabase';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });
  const statusParam = new URL(request.url).searchParams.get('status');
  let query = supabase.from('projects').select('*').eq('household_id', householdId).order('sort_order', { ascending: true }).order('created_at', { ascending: false });
  if (statusParam) {
    const statuses = statusParam.split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length > 0) query = query.in('status', statuses);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  const input: CreateProjectInput = parsed.data;
  const row: InsertTables<'projects'> = {
    household_id: householdId,
    name: input.name,
    description: input.description ?? null,
    start_date: input.start_date ?? null,
    target_end_date: input.target_end_date ?? null,
    linked_pot_id: input.linked_pot_id ?? null,
    linked_repayment_id: input.linked_repayment_id ?? null,
    estimated_budget: input.estimated_budget ?? null,
  };
  const { data: created, error } = await supabase.from('projects').insert(row as never).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const project = created as { id: string };
  await supabase.from('activity_feed').insert({
    household_id: householdId,
    actor_user_id: user.id,
    actor_type: 'user',
    action: 'created',
    object_name: input.name,
    object_detail: 'project',
    source_module: 'tasks',
    source_entity_id: project.id,
    action_url: '/dashboard/tasks?project=' + project.id,
    metadata: {},
  } as never);
  return NextResponse.json(created);
}
