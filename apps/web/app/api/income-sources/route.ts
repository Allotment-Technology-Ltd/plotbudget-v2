import { NextRequest, NextResponse } from 'next/server';
import {
  createIncomeSource,
  getIncomeSources,
  type CreateIncomeSourceInput,
  type FrequencyRule,
  type PaymentSource,
} from '@/lib/actions/income-source-actions';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';

const FREQUENCY_RULES: FrequencyRule[] = ['specific_date', 'last_working_day', 'every_4_weeks'];
const PAYMENT_SOURCES: PaymentSource[] = ['me', 'partner', 'joint'];

/**
 * GET /api/income-sources?household_id=...
 * List income sources for a household. Used by native app (Bearer token).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const householdId = request.nextUrl.searchParams.get('household_id');
  if (!householdId) {
    return NextResponse.json({ error: 'household_id required' }, { status: 400 });
  }

  const supabase = createSupabaseClientFromToken(token);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sources = await getIncomeSources(householdId, supabase);
  return NextResponse.json({ incomeSources: sources });
}

/**
 * POST /api/income-sources
 * Create an income source. Used by native app (Bearer token).
 * Body: CreateIncomeSourceInput
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

  const household_id = typeof body.household_id === 'string' ? body.household_id : undefined;
  const name = typeof body.name === 'string' ? body.name.trim() : undefined;
  const amount = typeof body.amount === 'number' ? body.amount : undefined;
  const frequency_rule =
    body.frequency_rule && FREQUENCY_RULES.includes(body.frequency_rule as FrequencyRule)
      ? (body.frequency_rule as FrequencyRule)
      : undefined;
  const payment_source =
    body.payment_source && PAYMENT_SOURCES.includes(body.payment_source as PaymentSource)
      ? (body.payment_source as PaymentSource)
      : undefined;

  if (!household_id || !name || amount === undefined || amount < 0 || !frequency_rule || !payment_source) {
    return NextResponse.json(
      { error: 'Missing or invalid: household_id, name, amount (>= 0), frequency_rule, payment_source' },
      { status: 400 }
    );
  }

  let day_of_month: number | null = null;
  if (frequency_rule === 'specific_date') {
    const d = body.day_of_month != null ? Number(body.day_of_month) : 1;
    if (d < 1 || d > 31) {
      return NextResponse.json({ error: 'day_of_month must be 1–31 for specific_date' }, { status: 400 });
    }
    day_of_month = d;
  }

  let anchor_date: string | null = null;
  if (frequency_rule === 'every_4_weeks') {
    anchor_date =
      typeof body.anchor_date === 'string' && body.anchor_date.trim() ? body.anchor_date.trim() : null;
    if (!anchor_date) {
      return NextResponse.json({ error: 'anchor_date required for every_4_weeks' }, { status: 400 });
    }
  }

  const supabase = createSupabaseClientFromToken(token);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const input: CreateIncomeSourceInput = {
    household_id,
    name,
    amount,
    frequency_rule,
    day_of_month,
    anchor_date,
    payment_source,
    sort_order: typeof body.sort_order === 'number' ? body.sort_order : undefined,
  };

  const result = await createIncomeSource(input, supabase);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, incomeSourceId: result.incomeSourceId });
}
