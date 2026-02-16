/**
 * POST /api/paycycles/next
 * Create next paycycle as draft (same as web "Create Next Cycle").
 * Body: { currentPaycycleId: string }
 * Auth: Bearer token.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';
import { createNextPaycycleCore } from '@/lib/paycycle/create-next-paycycle-core';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { currentPaycycleId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const currentPaycycleId = body.currentPaycycleId;
  if (!currentPaycycleId || typeof currentPaycycleId !== 'string') {
    return NextResponse.json({ error: 'currentPaycycleId is required' }, { status: 400 });
  }

  const supabase = createSupabaseClientFromToken(token);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await createNextPaycycleCore(supabase, currentPaycycleId, { status: 'draft' });
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true, cycleId: result.cycleId });
}
