import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';
import { lockInForecastAmount } from '@/lib/actions/forecast-actions';

/**
 * POST /api/forecast/lock-in
 * Lock in forecast amount for pot or repayment. Used by native app.
 * Body: { potId?: string, repaymentId?: string, amount: number, name: string, type: 'savings' | 'repay' }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const potId = typeof body.potId === 'string' ? body.potId : null;
  const repaymentId = typeof body.repaymentId === 'string' ? body.repaymentId : null;
  const amount = typeof body.amount === 'number' ? body.amount : 0;
  const name = typeof body.name === 'string' ? body.name : '';
  const type = body.type === 'savings' || body.type === 'repay' ? body.type : undefined;

  if (!name || !type) {
    return NextResponse.json(
      { error: 'Missing or invalid: name, type (savings or repay)' },
      { status: 400 }
    );
  }

  const result = await lockInForecastAmount(potId, repaymentId, amount, name, type, supabase);

  if (result.error) {
    const status = result.error === 'Unauthorized' ? 401 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ success: true });
}
