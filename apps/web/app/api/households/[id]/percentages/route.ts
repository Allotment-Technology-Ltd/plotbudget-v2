import { NextRequest, NextResponse } from 'next/server';
import { updateHouseholdPercentages } from '@/lib/actions/household-actions';
import type { UpdatePercentagesInput } from '@/lib/actions/household-actions';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';

function parseBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

function parsePercentagesBody(
  body: Record<string, unknown>
): UpdatePercentagesInput | { error: string } {
  const needs = typeof body.needs_percent === 'number' ? body.needs_percent : undefined;
  const wants = typeof body.wants_percent === 'number' ? body.wants_percent : undefined;
  const savings = typeof body.savings_percent === 'number' ? body.savings_percent : undefined;
  const repay = typeof body.repay_percent === 'number' ? body.repay_percent : undefined;
  if (needs === undefined || wants === undefined || savings === undefined || repay === undefined) {
    return { error: 'Missing or invalid: needs_percent, wants_percent, savings_percent, repay_percent' };
  }
  return {
    needs_percent: Math.round(needs),
    wants_percent: Math.round(wants),
    savings_percent: Math.round(savings),
    repay_percent: Math.round(repay),
  };
}

/**
 * PATCH /api/households/[id]/percentages
 * Update household category split percentages (needs, wants, savings, repay). Used by native app.
 * Body: { needs_percent, wants_percent, savings_percent, repay_percent } (must total 100)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = parseBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const input = parsePercentagesBody(body);
  if ('error' in input) {
    return NextResponse.json({ error: input.error }, { status: 400 });
  }

  const supabase = createSupabaseClientFromToken(token);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: householdId } = await params;
  const result = await updateHouseholdPercentages(householdId, input, supabase);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
