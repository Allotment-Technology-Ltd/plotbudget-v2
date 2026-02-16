/**
 * POST /api/paycycles/[id]/resync-draft
 * Resync draft cycle from active (recurring seeds). Same as web "Resync from active".
 * Body: { activePaycycleId: string }
 * Auth: Bearer token.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';
import { resyncDraftFromActiveCore } from '@/lib/paycycle/resync-draft-core';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: draftPaycycleId } = await params;
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { activePaycycleId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const activePaycycleId = body.activePaycycleId;
  if (!activePaycycleId || typeof activePaycycleId !== 'string') {
    return NextResponse.json({ error: 'activePaycycleId is required' }, { status: 400 });
  }

  const supabase = createSupabaseClientFromToken(token);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await resyncDraftFromActiveCore(supabase, draftPaycycleId, activePaycycleId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
