import { NextRequest, NextResponse } from 'next/server';
import { updateHouseholdPercentages } from '@/lib/actions/household-actions';
import type { UpdatePercentagesInput } from '@/lib/actions/household-actions';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';

/**
 * PATCH /api/households/[id]/percentages
 * Update household category split percentages (needs, wants, savings, repay). Used by native app.
 * Body: { needs_percent, wants_percent, savings_percent, repay_percent } (must total 100)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: householdId } = await params;

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const needs_percent = typeof body.needs_percent === 'number' ? body.needs_percent : undefined;
  const wants_percent = typeof body.wants_percent === 'number' ? body.wants_percent : undefined;
  const savings_percent = typeof body.savings_percent === 'number' ? body.savings_percent : undefined;
  const repay_percent = typeof body.repay_percent === 'number' ? body.repay_percent : undefined;

  if (
    needs_percent === undefined ||
    wants_percent === undefined ||
    savings_percent === undefined ||
    repay_percent === undefined
  ) {
    return NextResponse.json(
      { error: 'Missing or invalid: needs_percent, wants_percent, savings_percent, repay_percent' },
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

  const input: UpdatePercentagesInput = {
    needs_percent: Math.round(needs_percent),
    wants_percent: Math.round(wants_percent),
    savings_percent: Math.round(savings_percent),
    repay_percent: Math.round(repay_percent),
  };

  const result = await updateHouseholdPercentages(householdId, input, supabase);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
