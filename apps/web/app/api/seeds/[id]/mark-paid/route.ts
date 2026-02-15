import { NextRequest, NextResponse } from 'next/server';
import { markSeedPaid } from '@/lib/actions/ritual-actions';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';

type Payer = 'me' | 'partner' | 'both';

const PAYER_VALUES: Payer[] = ['me', 'partner', 'both'];

/**
 * POST /api/seeds/[id]/mark-paid
 * Mark a seed as paid. Used by native app (passes Bearer token).
 * Body: { payer: 'me' | 'partner' | 'both' }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: seedId } = await params;

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { payer?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const payer = body.payer;
  if (!payer || !PAYER_VALUES.includes(payer as Payer)) {
    return NextResponse.json(
      { error: 'Invalid payer. Must be me, partner, or both' },
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

  const result = await markSeedPaid(seedId, payer as Payer, supabase);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
