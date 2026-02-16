/**
 * POST /api/paycycles/[id]/close-ritual
 * Close the cycle ritual (lock budget for this paycycle). Same as web.
 * Auth: Bearer token.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';
import { getPartnerContext } from '@/lib/partner-context';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: paycycleId } = await params;
  const authHeader = _request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseClientFromToken(token);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { householdId: partnerHouseholdId, isPartner } = await getPartnerContext(supabase, user?.id ?? null);
  if (!user && !isPartner) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: paycycleData } = await supabase
    .from('paycycles')
    .select('household_id')
    .eq('id', paycycleId)
    .single();

  const paycycle = paycycleData as { household_id: string } | null;
  if (!paycycle) return NextResponse.json({ error: 'Paycycle not found' }, { status: 404 });

  const { data: profile } = await supabase
    .from('users')
    .select('household_id')
    .eq('id', user?.id ?? '')
    .maybeSingle();

  const profileRow = profile as { household_id: string | null } | null;
  const ownHousehold = profileRow?.household_id === paycycle.household_id;
  const partnerHousehold = isPartner && partnerHouseholdId === paycycle.household_id;
  if (!ownHousehold && !partnerHousehold) {
    return NextResponse.json({ error: 'Paycycle not found' }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('paycycles') as any)
    .update({ ritual_closed_at: new Date().toISOString() })
    .eq('id', paycycleId);

  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 });
  return NextResponse.json({ success: true });
}
