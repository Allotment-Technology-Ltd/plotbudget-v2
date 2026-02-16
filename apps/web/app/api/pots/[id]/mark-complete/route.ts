import { NextRequest, NextResponse } from 'next/server';
import { markPotComplete } from '@/lib/actions/pot-actions';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';
import { sendPushToUser } from '@/lib/push/send-to-user';

const STATUS_VALUES = ['complete', 'active'] as const;

/**
 * POST /api/pots/[id]/mark-complete
 * Mark a pot as complete (accomplished) or active. Used by native app (passes Bearer token).
 * Body: { status: 'complete' | 'active' }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: potId } = await params;

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const status = body.status;
  if (!status || !STATUS_VALUES.includes(status as (typeof STATUS_VALUES)[number])) {
    return NextResponse.json(
      { error: 'Invalid status. Must be complete or active' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClientFromToken(token);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await markPotComplete(potId, status as 'complete' | 'active', supabase);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Notify partner (PLOT-123)
  try {
    const { data: pot } = await supabase.from('pots').select('household_id').eq('id', potId).single();
    const potRow = pot as { household_id: string } | null;
    const potHouseholdId = potRow?.household_id;
    if (potHouseholdId) {
      const { data: household } = await supabase
        .from('households')
        .select('owner_id, partner_user_id')
        .eq('id', potHouseholdId)
        .single();
      const h = household as { owner_id: string; partner_user_id: string | null } | null;
      if (h) {
        const partnerUserId = user.id === h.owner_id ? h.partner_user_id : h.owner_id;
        if (partnerUserId) {
          await sendPushToUser(partnerUserId, {
            title: 'Partner activity',
            body: 'A pot was updated in your budget.',
            data: { path: '/(tabs)/two' },
            type: 'partner',
          });
        }
      }
    }
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ success: true });
}
