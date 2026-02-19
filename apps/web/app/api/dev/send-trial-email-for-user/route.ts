/**
 * Dev-only API: send trial email for a specific user with real data.
 * Gated by isTrialTestingDashboardAllowed().
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { allowTrialTestingOrAdmin } from '@/lib/auth/admin-gate';
import {
  sendTrialMilestoneEmail,
  sendTrialEndingSoonEmail,
  sendTrialEndedEmail,
  sendGraceReminderEmail,
  isEmailConfigured,
} from '@/lib/email/trial-transition';

const TRIAL_TEST_EMAILS = [
  'trial-milestone@plotbudget.test',
  'trial-ending@plotbudget.test',
  'trial-ended@plotbudget.test',
  'trial-grace@plotbudget.test',
  'trial-archive@plotbudget.test',
];

export type SendForUserTemplate =
  | 'milestone'
  | 'ending-soon'
  | 'ended-action-required'
  | 'grace-reminder';

export async function POST(req: Request) {
  if (!(await allowTrialTestingOrAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const userId = body.userId as string | undefined;
  const template = body.template as SendForUserTemplate | undefined;
  const forwardTo = (body.forwardTo as string | undefined)?.trim() || undefined;

  if (!userId || !template) {
    return NextResponse.json(
      { error: 'userId and template required' },
      { status: 400 }
    );
  }

  const validTemplates: SendForUserTemplate[] = [
    'milestone',
    'ending-soon',
    'ended-action-required',
    'grace-reminder',
  ];
  if (!validTemplates.includes(template)) {
    return NextResponse.json(
      { error: 'Invalid template', valid: validTemplates },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, display_name, household_id')
    .eq('id', userId)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const user = userData as { id: string; email: string; display_name: string | null; household_id: string | null };
  if (!TRIAL_TEST_EMAILS.includes(user.email)) {
    return NextResponse.json(
      { error: 'Only trial test users can be used' },
      { status: 403 }
    );
  }

  const displayName = user.display_name || 'there';
  const householdId = user.household_id;
  const recipientEmail = forwardTo ?? user.email;

  const counts = householdId
    ? await getHouseholdCounts(supabase, householdId)
    : { pots: 0, repayments: 0, needs: 0, wants: 0 };

  const FREE_POT_LIMIT = 2;
  const FREE_REPAYMENT_LIMIT = 2;
  const overPots = Math.max(0, (counts.pots ?? 0) - FREE_POT_LIMIT);
  const overRepayments = Math.max(0, (counts.repayments ?? 0) - FREE_REPAYMENT_LIMIT);

  let result;
  switch (template) {
    case 'milestone':
      result = await sendTrialMilestoneEmail({
        email: recipientEmail,
        displayName,
        cyclesCompleted: 1,
        totalCycles: 2,
        nextCycleEndsOn: '28 February 2026',
      });
      break;
    case 'ending-soon':
      result = await sendTrialEndingSoonEmail({
        email: recipientEmail,
        displayName,
        daysRemaining: 3,
        trialEndsOn: '15 March 2026',
        currentCounts: counts,
        freeTierLimits: { pots: 2, repayments: 2, needs: 5, wants: 5 },
      });
      break;
    case 'ended-action-required':
      result = await sendTrialEndedEmail({
        email: recipientEmail,
        displayName,
        overPots,
        overRepayments,
        graceDays: 7,
      });
      break;
    case 'grace-reminder':
      result = await sendGraceReminderEmail({
        email: recipientEmail,
        displayName,
        graceDay: 6,
      });
      break;
    default:
      return NextResponse.json({ error: 'Unknown template' }, { status: 400 });
  }

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: result.id });
}

async function getHouseholdCounts(
  supabase: ReturnType<typeof createAdminClient>,
  householdId: string
) {
  const [potsRes, repaymentsRes, needsRes, wantsRes] = await Promise.all([
    supabase
      .from('pots')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId)
      .eq('status', 'active'),
    supabase
      .from('repayments')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId)
      .eq('status', 'active'),
    supabase
      .from('seeds')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId)
      .eq('type', 'need'),
    supabase
      .from('seeds')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId)
      .eq('type', 'want'),
  ]);

  return {
    pots: potsRes.count ?? 0,
    repayments: repaymentsRes.count ?? 0,
    needs: needsRes.count ?? 0,
    wants: wantsRes.count ?? 0,
  };
}
