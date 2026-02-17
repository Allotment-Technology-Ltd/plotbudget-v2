import { NextRequest, NextResponse } from 'next/server';
import { updateSeed, deleteSeed } from '@/lib/actions/seed-actions';
import type { UpdateSeedInput } from '@/lib/actions/seed-actions';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';

/**
 * PATCH /api/seeds/[id]
 * Update a seed. Used by native app (passes Bearer token).
 * Body: UpdateSeedInput (partial)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: seedId } = await params;

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

  const input: UpdateSeedInput = {};

  if (typeof body.name === 'string') input.name = body.name;
  if (typeof body.amount === 'number' && body.amount >= 0) input.amount = body.amount;
  if (body.payment_source === 'me' || body.payment_source === 'partner' || body.payment_source === 'joint') {
    input.payment_source = body.payment_source;
  }
  if (typeof body.split_ratio === 'number' && body.split_ratio >= 0 && body.split_ratio <= 1) {
    input.split_ratio = body.split_ratio;
  }
  if (typeof body.uses_joint_account === 'boolean') input.uses_joint_account = body.uses_joint_account;
  if (typeof body.is_recurring === 'boolean') input.is_recurring = body.is_recurring;
  if (body.due_date !== undefined) {
    input.due_date =
      typeof body.due_date === 'string' && body.due_date.trim() ? body.due_date.trim() : null;
  }
  if (body.linked_pot_id !== undefined) {
    input.linked_pot_id =
      typeof body.linked_pot_id === 'string' && body.linked_pot_id ? body.linked_pot_id : null;
  }
  if (body.linked_repayment_id !== undefined) {
    input.linked_repayment_id =
      typeof body.linked_repayment_id === 'string' && body.linked_repayment_id
        ? body.linked_repayment_id
        : null;
  }

  if (body.pot && typeof body.pot === 'object') {
    const pot = body.pot as Record<string, unknown>;
    input.pot = {};
    if (typeof pot.current_amount === 'number') input.pot.current_amount = pot.current_amount;
    if (typeof pot.target_amount === 'number') input.pot.target_amount = pot.target_amount;
    if (pot.target_date !== undefined) {
      input.pot.target_date =
        typeof pot.target_date === 'string' && pot.target_date.trim() ? pot.target_date.trim() : null;
    }
    if (pot.status === 'active' || pot.status === 'complete' || pot.status === 'paused') {
      input.pot.status = pot.status;
    }
  }

  if (body.repayment && typeof body.repayment === 'object') {
    const repayment = body.repayment as Record<string, unknown>;
    input.repayment = {};
    if (typeof repayment.current_balance === 'number') {
      input.repayment.current_balance = repayment.current_balance;
    }
    if (repayment.target_date !== undefined) {
      input.repayment.target_date =
        typeof repayment.target_date === 'string' && repayment.target_date.trim()
          ? repayment.target_date.trim()
          : null;
    }
    if (repayment.status === 'active' || repayment.status === 'paid' || repayment.status === 'paused') {
      input.repayment.status = repayment.status;
    }
    if (repayment.interest_rate !== undefined) {
      input.repayment.interest_rate =
        typeof repayment.interest_rate === 'number' && repayment.interest_rate >= 0
          ? repayment.interest_rate
          : null;
    }
  }

  const result = await updateSeed(seedId, input, supabase);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/seeds/[id]
 * Delete a seed. Used by native app (passes Bearer token).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: seedId } = await params;

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

  const result = await deleteSeed(seedId, supabase);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
