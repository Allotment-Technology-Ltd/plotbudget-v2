import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPartnerContext } from '@/lib/partner-context';
import {
  createActivitySchema,
  type CreateActivityInput,
} from '@repo/logic';
import type { InsertTables, Json } from '@repo/supabase';

async function getHouseholdIdForCurrentUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<string | null> {
  const { data: profile } = (await supabase
    .from('users')
    .select('household_id')
    .eq('id', userId)
    .single()) as { data: { household_id: string | null } | null };
  if (profile?.household_id) return profile.household_id;
  const { householdId } = await getPartnerContext(supabase, userId);
  return householdId;
}

/**
 * GET /api/activity-feed
 * List activity feed items for the current user's household.
 * Query: ?limit=20, ?before=ISO_DATE (cursor pagination)
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const householdId = await getHouseholdIdForCurrentUser(supabase, user.id);
  if (!householdId) {
    return NextResponse.json(
      { error: 'No household found for user' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 1),
    100
  );
  const before = searchParams.get('before');

  let query = supabase
    .from('activity_feed')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (before) {
    query = query.lt('created_at', before);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
  return NextResponse.json(data ?? []);
}

/**
 * POST /api/activity-feed
 * Create an activity feed entry (actor = current user).
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const householdId = await getHouseholdIdForCurrentUser(supabase, user.id);
  if (!householdId) {
    return NextResponse.json(
      { error: 'No household found for user' },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input: CreateActivityInput = parsed.data;
  const row: InsertTables<'activity_feed'> = {
    household_id: householdId,
    actor_user_id: user.id,
    actor_type: input.actor_type,
    action: input.action,
    object_name: input.object_name,
    object_detail: input.object_detail ?? null,
    source_module: input.source_module,
    source_entity_id: input.source_entity_id ?? null,
    action_url: input.action_url ?? null,
    metadata: (input.metadata ?? {}) as Json,
  };

  const { data: created, error } = await supabase
    .from('activity_feed')
    .insert(row as never)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to create activity' },
      { status: 500 }
    );
  }
  return NextResponse.json(created);
}
