import { NextRequest, NextResponse } from 'next/server';
import { markOverdueSeedsPaid } from '@/lib/actions/seed-actions';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';

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

  await markOverdueSeedsPaid(paycycleId, supabase);

  return NextResponse.json({ success: true });
}
