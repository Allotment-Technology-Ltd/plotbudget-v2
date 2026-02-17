import { NextRequest, NextResponse } from 'next/server';
import { updatePaycycleAllocations } from '@/lib/actions/seed-actions';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';

/**
 * POST /api/paycycles/[id]/recompute-allocations
 * Recompute paycycle total_allocated and alloc_* / rem_* from current seeds.
 * Used by native (and web) when a cycle has seeds but totals are stale (e.g. 0).
 * Keeps web and mobile on the same server-derived numbers.
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

  try {
    await updatePaycycleAllocations(paycycleId, supabase);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to recompute';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
