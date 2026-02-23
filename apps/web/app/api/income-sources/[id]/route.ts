import { NextRequest, NextResponse } from 'next/server';
import {
  updateIncomeSource,
  deleteIncomeSource,
  type UpdateIncomeSourceInput,
  type FrequencyRule,
  type PaymentSource,
} from '@/lib/actions/income-source-actions';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';

const FREQUENCY_RULES: FrequencyRule[] = ['specific_date', 'last_working_day', 'every_4_weeks'];
const PAYMENT_SOURCES: PaymentSource[] = ['me', 'partner', 'joint'];

/**
 * POST /api/income-sources/[id]
 * Handles POST as an alias for PATCH on this resource. When the middleware redirects
 * a server-action POST from /onboarding to another route, the browser re-issues the
 * request as POST, losing the Next-Action header. That request can land here with
 * update-style payloads. Delegating to PATCH ensures clients get a valid 200 response
 * rather than a 405, and the update is applied correctly.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context);
}

/**
 * PATCH /api/income-sources/[id]
 * Update an income source. Used by native app (Bearer token).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const supabase = createSupabaseClientFromToken(token);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const input: UpdateIncomeSourceInput = {};

  if (typeof body.name === 'string') input.name = body.name.trim();
  if (typeof body.amount === 'number' && body.amount >= 0) input.amount = body.amount;
  if (body.frequency_rule && FREQUENCY_RULES.includes(body.frequency_rule as FrequencyRule)) {
    input.frequency_rule = body.frequency_rule as FrequencyRule;
    if (input.frequency_rule !== 'specific_date') input.day_of_month = null;
    if (input.frequency_rule !== 'every_4_weeks') input.anchor_date = null;
  }
  if (body.day_of_month !== undefined) {
    const d = body.day_of_month != null ? Number(body.day_of_month) : null;
    input.day_of_month = d != null && d >= 1 && d <= 31 ? d : null;
  }
  if (body.anchor_date !== undefined) {
    input.anchor_date =
      typeof body.anchor_date === 'string' && body.anchor_date.trim() ? body.anchor_date.trim() : null;
  }
  if (body.payment_source && PAYMENT_SOURCES.includes(body.payment_source as PaymentSource)) {
    input.payment_source = body.payment_source as PaymentSource;
  }
  if (typeof body.sort_order === 'number') input.sort_order = body.sort_order;
  if (typeof body.is_active === 'boolean') input.is_active = body.is_active;

  const result = await updateIncomeSource(id, input, supabase);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/income-sources/[id]
 * Delete an income source. Used by native app (Bearer token).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const result = await deleteIncomeSource(id, supabase);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
