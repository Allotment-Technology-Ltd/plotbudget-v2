/**
 * Dev-only API: run trial emails cron logic for selected user(s).
 * Dry-run mode returns what would be sent without actually sending.
 * Gated by isTrialTestingDashboardAllowed().
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@repo/supabase';

type CronUserRow = Pick<
  Database['public']['Tables']['users']['Row'],
  | 'id'
  | 'email'
  | 'display_name'
  | 'household_id'
  | 'trial_cycles_completed'
  | 'trial_ended_at'
  | 'grace_period_start'
  | 'trial_milestone_email_sent'
  | 'trial_ending_email_sent'
  | 'trial_ended_email_sent'
  | 'grace_period_reminder_sent'
  | 'subscription_tier'
  | 'founding_member_until'
  | 'founding_member_ending_soon_email_sent'
>;

type CronUserWithHousehold = CronUserRow & {
  households: { founding_member_until: string | null } | null;
};

import { allowTrialTestingOrAdmin } from '@/lib/auth/admin-gate';
import {
  sendTrialMilestoneEmail,
  sendTrialEndingSoonEmail,
  sendTrialEndedEmail,
  sendGraceReminderEmail,
  sendFoundingMemberEndingSoonEmail,
  isEmailConfigured,
} from '@/lib/email/trial-transition';

const TRIAL_TEST_EMAILS = [
  'trial-milestone@plotbudget.test',
  'trial-ending@plotbudget.test',
  'trial-ended@plotbudget.test',
  'trial-grace@plotbudget.test',
  'trial-archive@plotbudget.test',
];

const FREE_POT_LIMIT = 2;
const FREE_REPAYMENT_LIMIT = 2;

export async function POST(req: Request) {
  if (!(await allowTrialTestingOrAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const userId = body.userId as string | undefined;
  const dryRun = body.dryRun === true;
  const asOfDateRaw = body.asOfDate as string | undefined;
  const forwardTo = (body.forwardTo as string | undefined)?.trim() || undefined;

  if (!dryRun && !isEmailConfigured()) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });
  }

  let today: Date;
  if (asOfDateRaw) {
    today = new Date(asOfDateRaw);
    if (isNaN(today.getTime())) {
      return NextResponse.json(
        { error: 'Invalid asOfDate; use ISO string (e.g. 2026-03-15 or 2026-03-15T09:00:00Z)' },
        { status: 400 }
      );
    }
  } else {
    today = new Date();
  }

  const supabase = createAdminClient();

  let query = supabase
    .from('users')
    .select(
      `
      id,
      email,
      display_name,
      household_id,
      households (
        founding_member_until
      ),
      trial_cycles_completed,
      trial_ended_at,
      grace_period_start,
      trial_milestone_email_sent,
      trial_ending_email_sent,
      trial_ended_email_sent,
      grace_period_reminder_sent,
      subscription_tier,
      founding_member_until,
      founding_member_ending_soon_email_sent
    `
    )
    .not('household_id', 'is', null)
    .eq('subscription_tier', 'free');

  if (userId) {
    query = query.eq('id', userId);
  } else {
    query = query.in('email', TRIAL_TEST_EMAILS);
  }

  const { data: users, error } = await query;
  const filtered = (users ?? []) as unknown as CronUserWithHousehold[];

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{
    email: string;
    action: string;
    wouldSend?: boolean;
    sent?: boolean;
    error?: string;
  }> = [];

  for (const user of filtered) {
    if (user.subscription_tier === 'pro') continue;

    // Founding members: skip trial/grace; send ending-soon 1 month before
    // Use household status if available (couple = 1 household), fall back to user status for legacy
    const householdFounding = (user.households as unknown as { founding_member_until: string | null } | null)?.founding_member_until;
    const userFounding = user.founding_member_until;
    const foundingUntil = householdFounding ?? userFounding;

    const isFoundingMember =
      foundingUntil && new Date(foundingUntil) > today;
    if (isFoundingMember) {
      if (
        !user.founding_member_ending_soon_email_sent &&
        foundingUntil
      ) {
        const until = new Date(foundingUntil);
        const daysUntilEnd = Math.ceil(
          (until.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilEnd >= 28 && daysUntilEnd <= 31) {
          if (dryRun) {
            results.push({
              email: user.email,
              action: 'founding-member-ending-soon',
              wouldSend: true,
            });
          } else {
            const result = await sendFoundingMemberEndingSoonEmail({
              email: forwardTo ?? user.email,
              displayName: user.display_name || 'there',
              foundingMemberEndsOn: formatDate(foundingUntil),
            });
            if (result.success) {
              await supabase
                .from('users')
                .update({
                  founding_member_ending_soon_email_sent: true,
                  updated_at: today.toISOString(),
                } as never)
                .eq('id', user.id);
              results.push({
                email: user.email,
                action: 'founding-member-ending-soon',
                sent: true,
              });
            } else {
              results.push({
                email: user.email,
                action: 'founding-member-ending-soon',
                error: result.error,
              });
            }
          }
        }
      }
      continue;
    }

    const householdId = user.household_id!;
    const displayName = user.display_name || 'there';

    try {
      const { data: paycycles } = await supabase
        .from('paycycles')
        .select('id, status, end_date')
        .eq('household_id', householdId)
        .order('end_date', { ascending: false });

      type PaycycleRow = { id: string; status: string; end_date: string };
      const cycles = (paycycles ?? []) as PaycycleRow[];
      const completedCycles = cycles.filter((p) => p.status === 'completed');
      const activeCycle = cycles.find((p) => p.status === 'active');
      const completedCount = completedCycles.length;

      const recipientEmail = forwardTo ?? user.email;

      // Milestone
      if (completedCount >= 1 && !user.trial_milestone_email_sent) {
        if (dryRun) {
          results.push({ email: user.email, action: 'milestone', wouldSend: true });
        } else {
          const nextEndsOn = activeCycle?.end_date
            ? formatDate(activeCycle.end_date)
            : null;
          const result = await sendTrialMilestoneEmail({
            email: recipientEmail,
            displayName,
            cyclesCompleted: 1,
            totalCycles: 2,
            nextCycleEndsOn: nextEndsOn,
          });
          if (result.success) {
            await supabase
              .from('users')
              .update({ trial_milestone_email_sent: true, updated_at: today.toISOString() } as never)
              .eq('id', user.id);
            results.push({ email: user.email, action: 'milestone', sent: true });
          } else {
            results.push({ email: user.email, action: 'milestone', error: result.error });
          }
        }
        continue;
      }

      // Ending soon
      if (completedCount === 1 && activeCycle && !user.trial_ending_email_sent) {
        const endDate = new Date(activeCycle.end_date);
        const daysUntilEnd = Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
          if (daysUntilEnd <= 3 && daysUntilEnd >= 0) {
          if (dryRun) {
            results.push({ email: user.email, action: 'ending-soon', wouldSend: true });
          } else {
            const counts = await getHouseholdCounts(supabase, householdId);
            const result = await sendTrialEndingSoonEmail({
              email: recipientEmail,
              displayName,
              daysRemaining: Math.max(1, daysUntilEnd),
              trialEndsOn: formatDate(activeCycle.end_date),
              currentCounts: counts,
              freeTierLimits: { pots: 2, repayments: 2, needs: 5, wants: 5 },
            });
            if (result.success) {
              await supabase
                .from('users')
                .update({ trial_ending_email_sent: true, updated_at: today.toISOString() } as never)
                .eq('id', user.id);
              results.push({ email: user.email, action: 'ending-soon', sent: true });
            } else {
              results.push({ email: user.email, action: 'ending-soon', error: result.error });
            }
          }
          continue;
        }
      }

      // Trial ended
      if (completedCount >= 2 && !user.trial_ended_email_sent) {
        const counts = await getHouseholdCounts(supabase, householdId);
        const overPots = Math.max(0, (counts.pots ?? 0) - FREE_POT_LIMIT);
        const overRepayments = Math.max(0, (counts.repayments ?? 0) - FREE_REPAYMENT_LIMIT);
        if (overPots > 0 || overRepayments > 0) {
          if (dryRun) {
            results.push({ email: user.email, action: 'ended-action-required', wouldSend: true });
          } else {
            const result = await sendTrialEndedEmail({
              email: recipientEmail,
              displayName,
              overPots,
              overRepayments,
              graceDays: 7,
            });
            if (result.success) {
              await supabase
                .from('users')
                .update({
                  trial_ended_email_sent: true,
                  trial_ended_at: today.toISOString(),
                  grace_period_start: today.toISOString(),
                  updated_at: today.toISOString(),
                } as never)
                .eq('id', user.id);
              results.push({ email: user.email, action: 'ended-action-required', sent: true });
            } else {
              results.push({ email: user.email, action: 'ended-action-required', error: result.error });
            }
          }
          continue;
        }
      }

      // Grace reminder
      if (user.grace_period_start && !user.grace_period_reminder_sent) {
        const graceStart = new Date(user.grace_period_start);
        const daysSinceGrace = Math.floor(
          (today.getTime() - graceStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceGrace >= 6) {
          if (dryRun) {
            results.push({ email: user.email, action: 'grace-reminder', wouldSend: true });
          } else {
            const result = await sendGraceReminderEmail({
              email: recipientEmail,
              displayName,
              graceDay: 6,
            });
            if (result.success) {
              await supabase
                .from('users')
                .update({ grace_period_reminder_sent: true, updated_at: today.toISOString() } as never)
                .eq('id', user.id);
              results.push({ email: user.email, action: 'grace-reminder', sent: true });
            } else {
              results.push({ email: user.email, action: 'grace-reminder', error: result.error });
            }
          }
          continue;
        }
      }
    } catch (err) {
      results.push({
        email: user.email,
        action: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    dryRun,
    processed: results.length,
    results,
    ...(asOfDateRaw && { asOfDate: today.toISOString() }),
  });
}

async function getHouseholdCounts(
  supabase: ReturnType<typeof createAdminClient>,
  householdId: string
) {
  const [potsRes, repaymentsRes] = await Promise.all([
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
  ]);
  return {
    pots: potsRes.count ?? 0,
    repayments: repaymentsRes.count ?? 0,
    needs: 0,
    wants: 0,
  };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
