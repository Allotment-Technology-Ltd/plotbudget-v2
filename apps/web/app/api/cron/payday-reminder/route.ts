/**
 * Cron: send push notifications for payday reminder.
 * Run daily (e.g. 9am user local or UTC). Finds active paycycles ending today or tomorrow,
 * sends push to household owner and partner (if they have tokens).
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushToUser } from '@/lib/push/send-to-user';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function dateString(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'Cron not configured (CRON_SECRET missing)' },
      { status: 503 }
    );
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = dateString(new Date());
  const tomorrow = dateString(new Date(Date.now() + 24 * 60 * 60 * 1000));

  type CycleRow = { id: string; household_id: string; end_date: string };
  type HouseholdRow = { id: string; owner_id: string; partner_user_id: string | null };

  const { data: cyclesData, error: cyclesError } = await supabase
    .from('paycycles')
    .select('id, household_id, end_date')
    .eq('status', 'active')
    .in('end_date', [today, tomorrow]);
  const cycles = (cyclesData ?? []) as CycleRow[];

  if (cyclesError) {
    return NextResponse.json({ error: cyclesError.message }, { status: 500 });
  }

  if (!cycles.length) {
    return NextResponse.json({ processed: 0, message: 'No paycycles ending today or tomorrow' });
  }

  const householdIds = [...new Set(cycles.map((c) => c.household_id))];
  const { data: householdsData, error: hError } = await supabase
    .from('households')
    .select('id, owner_id, partner_user_id')
    .in('id', householdIds);
  const households = (householdsData ?? []) as HouseholdRow[];

  if (hError || !households.length) {
    return NextResponse.json({ error: hError?.message ?? 'No households' }, { status: 500 });
  }

  const endDates = new Map(cycles.map((c) => [c.household_id, c.end_date]));
  const processed: string[] = [];
  const errors: string[] = [];

  for (const h of households) {
    const endDate = endDates.get(h.id);
    if (!endDate) continue;
    const isTomorrow = endDate === tomorrow;
    const title = isTomorrow ? 'Payday tomorrow' : 'Payday is today';
    const body = isTomorrow
      ? 'Your pay cycle ends tomorrow. Time to update your budget.'
      : 'Your pay cycle ends today. Close the ritual when you\'re ready.';

    const userIds = [h.owner_id];
    if (h.partner_user_id) userIds.push(h.partner_user_id);

    for (const userId of userIds) {
      const result = await sendPushToUser(userId, {
        title,
        body,
        data: { path: '/(tabs)' },
        type: 'payday',
      });
      if (result.sent > 0) processed.push(`${userId}: payday-reminder`);
      if (result.error) errors.push(`${userId}: ${result.error}`);
    }
  }

  return NextResponse.json({
    processed: processed.length,
    processedList: processed,
    errors: errors.length > 0 ? errors : undefined,
  });
}
