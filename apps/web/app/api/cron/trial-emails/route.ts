/**
 * Cron route for trial transition emails.
 * Runs daily (e.g. 9am UTC via Vercel Cron).
 * Verify with CRON_SECRET in Authorization header.
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';

type UserRow = Pick<
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
>;
import {
  sendTrialMilestoneEmail,
  sendTrialEndingSoonEmail,
  sendTrialEndedEmail,
  sendGraceReminderEmail,
  isEmailConfigured,
} from '@/lib/email/trial-transition';

const FREE_POT_LIMIT = 2;
const FREE_REPAYMENT_LIMIT = 2;

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY not set' },
      { status: 500 }
    );
  }

  const supabase = createAdminClient();
  const today = new Date();

  // Fetch users with household_id and trial tracking fields
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select(
      `
      id,
      email,
      display_name,
      household_id,
      created_at,
      trial_cycles_completed,
      trial_ended_at,
      grace_period_start,
      trial_milestone_email_sent,
      trial_ending_email_sent,
      trial_ended_email_sent,
      grace_period_reminder_sent,
      subscription_tier
    `
    )
    .not('household_id', 'is', null);

  if (usersError) {
    return NextResponse.json(
      { error: usersError.message },
      { status: 500 }
    );
  }

  const processed: string[] = [];
  const errors: string[] = [];

  for (const user of (users ?? []) as UserRow[]) {
    // Skip pro users
    if (user.subscription_tier === 'pro') continue;

    const householdId = user.household_id!;
    const displayName = user.display_name || 'there';

    try {
      // Fetch paycycles for this household
      const { data: paycycles } = await supabase
        .from('paycycles')
        .select('id, status, end_date, ritual_closed_at')
        .eq('household_id', householdId)
        .order('end_date', { ascending: false });

      type PaycycleRow = { id: string; status: string; end_date: string; ritual_closed_at: string | null };
      const cycles = (paycycles ?? []) as PaycycleRow[];
      const completedCycles = cycles.filter((p) => p.status === 'completed');
      const activeCycle = cycles.find((p) => p.status === 'active');
      const completedCount = completedCycles.length;

      // Email 2: First cycle complete, milestone not yet sent
      if (completedCount >= 1 && !user.trial_milestone_email_sent) {
        const nextEndsOn = activeCycle?.end_date
          ? formatDate(activeCycle.end_date)
          : null;

        const result = await sendTrialMilestoneEmail({
          email: user.email,
          displayName,
          cyclesCompleted: 1,
          totalCycles: 2,
          nextCycleEndsOn: nextEndsOn,
        });

        if (result.success) {
          await supabase
            .from('users')
            .update({ trial_milestone_email_sent: true, updated_at: new Date().toISOString() } as never)
            .eq('id', user.id);
          processed.push(`${user.email}: milestone`);
        } else {
          errors.push(`${user.email} milestone: ${result.error}`);
        }
        continue; // Only one email per run per user
      }

      // Email 3: Trial ending soon (3 days before 2nd cycle ends)
      if (completedCount === 1 && activeCycle && !user.trial_ending_email_sent) {
        const endDate = new Date(activeCycle.end_date);
        const daysUntilEnd = Math.ceil(
          (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilEnd <= 3 && daysUntilEnd >= 0) {
          const counts = await getHouseholdCounts(supabase, householdId);
          const result = await sendTrialEndingSoonEmail({
            email: user.email,
            displayName,
            daysRemaining: Math.max(1, daysUntilEnd),
            trialEndsOn: formatDate(activeCycle.end_date),
            currentCounts: counts,
            freeTierLimits: { pots: 2, repayments: 2, needs: 5, wants: 5 },
          });

          if (result.success) {
            await supabase
              .from('users')
              .update({ trial_ending_email_sent: true, updated_at: new Date().toISOString() } as never)
              .eq('id', user.id);
            processed.push(`${user.email}: ending-soon`);
          } else {
            errors.push(`${user.email} ending-soon: ${result.error}`);
          }
          continue;
        }
      }

      // Email 4: Trial ended (2 cycles complete, over limits)
      if (completedCount >= 2 && !user.trial_ended_email_sent) {
        const counts = await getHouseholdCounts(supabase, householdId);
        const overPots = Math.max(0, (counts.pots ?? 0) - FREE_POT_LIMIT);
        const overRepayments = Math.max(0, (counts.repayments ?? 0) - FREE_REPAYMENT_LIMIT);

        if (overPots > 0 || overRepayments > 0) {
          const result = await sendTrialEndedEmail({
            email: user.email,
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
            processed.push(`${user.email}: trial-ended`);
          } else {
            errors.push(`${user.email} trial-ended: ${result.error}`);
          }
          continue;
        }
      }

      // Email 5: Grace period reminder (day 6 of 7)
      if (user.grace_period_start && !user.grace_period_reminder_sent) {
        const graceStart = new Date(user.grace_period_start);
        const daysSinceGrace = Math.floor(
          (today.getTime() - graceStart.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceGrace >= 6) {
          const result = await sendGraceReminderEmail({
            email: user.email,
            displayName,
            graceDay: 6,
          });

          if (result.success) {
            await supabase
              .from('users')
              .update({ grace_period_reminder_sent: true, updated_at: today.toISOString() } as never)
              .eq('id', user.id);
            processed.push(`${user.email}: grace-reminder`);
          } else {
            errors.push(`${user.email} grace-reminder: ${result.error}`);
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${user.email}: ${msg}`);
    }
  }

  return NextResponse.json({
    processed: processed.length,
    processedList: processed,
    errors: errors.length > 0 ? errors : undefined,
  });
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
