import { NextRequest, NextResponse } from 'next/server';
import { createSeed } from '@/lib/actions/seed-actions';
import type { CreateSeedInput } from '@/lib/actions/seed-actions';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';

const SEED_TYPES = ['need', 'want', 'savings', 'repay'] as const;
const PAYMENT_SOURCES = ['me', 'partner', 'joint'] as const;

/**
 * POST /api/seeds
 * Create a seed. Used by native app (passes Bearer token).
 * Body: CreateSeedInput (name, amount, type, payment_source, paycycle_id, household_id, etc.)
 */
export async function POST(request: NextRequest) {
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

  const type = body.type;
  if (!type || !SEED_TYPES.includes(type as (typeof SEED_TYPES)[number])) {
    return NextResponse.json(
      { error: 'Invalid type. Must be need, want, savings, or repay' },
      { status: 400 }
    );
  }

  const payment_source = body.payment_source;
  if (!payment_source || !PAYMENT_SOURCES.includes(payment_source as (typeof PAYMENT_SOURCES)[number])) {
    return NextResponse.json(
      { error: 'Invalid payment_source. Must be me, partner, or joint' },
      { status: 400 }
    );
  }

  const name = typeof body.name === 'string' ? body.name : undefined;
  const amount = typeof body.amount === 'number' ? body.amount : undefined;
  const paycycle_id = typeof body.paycycle_id === 'string' ? body.paycycle_id : undefined;
  const household_id = typeof body.household_id === 'string' ? body.household_id : undefined;

  if (!name || !amount || amount < 0.01 || !paycycle_id || !household_id) {
    return NextResponse.json(
      { error: 'Missing or invalid: name, amount (>= 0.01), paycycle_id, household_id' },
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

  const input: CreateSeedInput = {
    name,
    amount,
    type: type as CreateSeedInput['type'],
    payment_source: payment_source as CreateSeedInput['payment_source'],
    paycycle_id,
    household_id,
    is_recurring: body.is_recurring === true,
    split_ratio:
      typeof body.split_ratio === 'number' && body.split_ratio >= 0 && body.split_ratio <= 1
        ? body.split_ratio
        : undefined,
    uses_joint_account: body.uses_joint_account === true,
    due_date:
      typeof body.due_date === 'string' && body.due_date.trim()
        ? body.due_date.trim()
        : null,
    linked_pot_id:
      typeof body.linked_pot_id === 'string' && body.linked_pot_id
        ? body.linked_pot_id
        : null,
    linked_repayment_id:
      typeof body.linked_repayment_id === 'string' && body.linked_repayment_id
        ? body.linked_repayment_id
        : null,
  };

  if (body.pot && typeof body.pot === 'object') {
    const pot = body.pot as Record<string, unknown>;
    const current_amount = typeof pot.current_amount === 'number' ? pot.current_amount : 0;
    const target_amount = typeof pot.target_amount === 'number' ? pot.target_amount : 0;
    const target_date =
      typeof pot.target_date === 'string' && pot.target_date.trim()
        ? pot.target_date.trim()
        : null;
    const status =
      pot.status === 'active' || pot.status === 'complete' || pot.status === 'paused'
        ? pot.status
        : 'active';
    input.pot = { current_amount, target_amount, target_date, status };
  }

  if (body.repayment && typeof body.repayment === 'object') {
    const repayment = body.repayment as Record<string, unknown>;
    const starting_balance =
      typeof repayment.starting_balance === 'number' ? repayment.starting_balance : 0;
    const current_balance =
      typeof repayment.current_balance === 'number' ? repayment.current_balance : starting_balance;
    const target_date =
      typeof repayment.target_date === 'string' && repayment.target_date.trim()
        ? repayment.target_date.trim()
        : null;
    const status =
      repayment.status === 'active' || repayment.status === 'paid' || repayment.status === 'paused'
        ? repayment.status
        : 'active';
    input.repayment = { starting_balance, current_balance, target_date, status };
  }

  const result = await createSeed(input, supabase);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
