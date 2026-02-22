import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';

/** 0=Sunday, 1=Monday, ..., 6=Saturday */
const WEEK_START_DAY_MIN = 0;
const WEEK_START_DAY_MAX = 6;

export type MealPlanSettingsResponse = {
  week_start_day: number;
};

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  const { data: row, error } = await supabase
    .from('households')
    .select('meal_plan_week_start_day')
    .eq('id', householdId)
    .single();

  if (error || !row) return NextResponse.json({ error: error?.message ?? 'Household not found' }, { status: error?.code === 'PGRST116' ? 404 : 500 });

  const week_start_day = Math.min(WEEK_START_DAY_MAX, Math.max(WEEK_START_DAY_MIN, Number((row as { meal_plan_week_start_day: number }).meal_plan_week_start_day ?? 0)));
  return NextResponse.json({ week_start_day } as MealPlanSettingsResponse);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const householdId = await getHouseholdIdForUser(supabase, user.id);
  if (!householdId) return NextResponse.json({ error: 'No household found for user' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const b = body as { week_start_day?: unknown };
  const raw = b.week_start_day;
  const week_start_day = typeof raw === 'number' && Number.isInteger(raw) && raw >= WEEK_START_DAY_MIN && raw <= WEEK_START_DAY_MAX
    ? raw
    : null;
  if (week_start_day === null) {
    return NextResponse.json(
      { error: `week_start_day must be an integer between ${WEEK_START_DAY_MIN} and ${WEEK_START_DAY_MAX} (0=Sunday, 6=Saturday)` },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from('households')
    .update({ meal_plan_week_start_day: week_start_day } as never)
    .eq('id', householdId);

  if (updateError) return NextResponse.json({ error: updateError.message ?? 'Failed to update settings' }, { status: 500 });
  return NextResponse.json({ week_start_day } as MealPlanSettingsResponse);
}
