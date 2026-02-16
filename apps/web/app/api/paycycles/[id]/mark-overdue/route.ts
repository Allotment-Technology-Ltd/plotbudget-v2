import { NextRequest, NextResponse } from 'next/server';
import { markOverdueSeedsPaid } from '@/lib/actions/seed-actions';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';
import { sendPushToUser } from '@/lib/push/send-to-user';

/**
 * POST /api/paycycles/[id]/mark-overdue
 * Mark seeds with past due_date as paid. Used by native when loading active cycle.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paycycleId } = await params;

  const authHeader = _request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseClientFromToken(token);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: paycycle } = await supabase
    .from('paycycles')
    .select('household_id')
    .eq('id', paycycleId)
    .single();

  if (!paycycle) {
    return NextResponse.json({ error: 'Paycycle not found' }, { status: 404 });
  }

  const { data: profile } = (await supabase
    .from('users')
    .select('household_id')
    .eq('id', user.id)
    .maybeSingle()) as { data: { household_id: string | null } | null };

  const { data: partnerHouseholdRow } = (await supabase
    .from('households')
    .select('id')
    .eq('partner_user_id', user.id)
    .maybeSingle()) as { data: { id: string } | null };

  const paycycleHouseholdId = (paycycle as { household_id: string }).household_id;
  const ownHousehold = profile?.household_id === paycycleHouseholdId;
  const partnerHasAccess = partnerHouseholdRow?.id === paycycleHouseholdId;

  if (!ownHousehold && !partnerHasAccess) {
    return NextResponse.json({ error: 'Paycycle not found' }, { status: 404 });
  }

  const count = await markOverdueSeedsPaid(paycycleId, supabase);

  if (count > 0) {
    const title = 'Bills marked as paid';
    const body =
      count === 1
        ? '1 bill was marked as paid (due date passed).'
        : `${count} bills were marked as paid (due date passed).`;
    await sendPushToUser(user.id, {
      title,
      body,
      data: { path: '/(tabs)/two' },
      type: 'bills_marked_paid',
    });
  }

  return NextResponse.json({ success: true });
}
