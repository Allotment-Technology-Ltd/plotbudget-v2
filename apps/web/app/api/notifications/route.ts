import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPartnerContext } from '@/lib/partner-context';
import {
  createNotificationSchema,
  type CreateNotificationInput,
} from '@repo/logic';
import type { InsertTables } from '@repo/supabase';

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
 * GET /api/notifications
 * List notifications for the current user's household.
 * Query: ?unread=true, ?limit=20
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
  const unreadOnly = searchParams.get('unread') === 'true';
  const limit = Math.min(
    Math.max(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 1),
    100
  );

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
  return NextResponse.json(data ?? []);
}

/**
 * POST /api/notifications
 * Create a notification (e.g. from a module or system).
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

  const parsed = createNotificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input: CreateNotificationInput = parsed.data;
  const row: InsertTables<'notifications'> = {
    household_id: householdId,
    user_id: user.id,
    title: input.title,
    body: input.body ?? null,
    source_module: input.source_module,
    source_entity_id: input.source_entity_id ?? null,
    action_url: input.action_url ?? null,
  };

  const { data: created, error } = await supabase
    .from('notifications')
    .insert(row as never)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to create notification' },
      { status: 500 }
    );
  }
  return NextResponse.json(created);
}
