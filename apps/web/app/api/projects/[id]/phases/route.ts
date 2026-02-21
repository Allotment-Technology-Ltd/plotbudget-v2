import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';
import { createPhaseSchema, type CreatePhaseInput } from '@repo/logic';
import type { InsertTables } from '@repo/supabase';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).eq('household_id', householdId).single();
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const { data, error } = await supabase.from('project_phases').select('*').eq('project_id', projectId).order('sort_order', { ascending: true });
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to fetch phases' }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data: project } = await supabase.from('projects').select('id').eq('id', projectId).eq('household_id', householdId).single();
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const parsed = createPhaseSchema.safeParse({ ...(body as object), project_id: projectId });
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });

  const input: CreatePhaseInput = parsed.data;
  const row: InsertTables<'project_phases'> = {
    project_id: projectId,
    household_id: householdId,
    name: input.name,
    description: input.description ?? null,
    sort_order: input.sort_order ?? 0,
    status: input.status ?? 'pending',
  };

  const { data: created, error } = await supabase.from('project_phases').insert(row as never).select().single();
  if (error) return NextResponse.json({ error: error.message ?? 'Failed to create phase' }, { status: 500 });
  return NextResponse.json(created);
}
