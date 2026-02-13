/**
 * Dev-only API: fetch trial test users for the dashboard.
 * Gated by isTrialTestingDashboardAllowed().
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isTrialTestingDashboardAllowed } from '@/lib/feature-flags';

const TRIAL_TEST_EMAILS = [
  'trial-milestone@plotbudget.test',
  'trial-ending@plotbudget.test',
  'trial-ended@plotbudget.test',
  'trial-grace@plotbudget.test',
  'trial-archive@plotbudget.test',
];

export type TrialUserSummary = {
  id: string;
  email: string;
  displayName: string | null;
  householdId: string | null;
  trialCyclesCompleted: number;
  trialEndedAt: string | null;
  gracePeriodStart: string | null;
  trialMilestoneEmailSent: boolean;
  trialEndingEmailSent: boolean;
  trialEndedEmailSent: boolean;
  gracePeriodReminderSent: boolean;
  graceDay: number | null;
};

export async function GET() {
  if (!isTrialTestingDashboardAllowed()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createAdminClient();

  const { data: users, error } = await supabase
    .from('users')
    .select(
      `
      id,
      email,
      display_name,
      household_id,
      trial_cycles_completed,
      trial_ended_at,
      grace_period_start,
      trial_milestone_email_sent,
      trial_ending_email_sent,
      trial_ended_email_sent,
      grace_period_reminder_sent
    `
    )
    .in('email', TRIAL_TEST_EMAILS);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type UserRow = {
    id: string;
    email: string;
    display_name: string | null;
    household_id: string | null;
    trial_cycles_completed: number;
    trial_ended_at: string | null;
    grace_period_start: string | null;
    trial_milestone_email_sent: boolean;
    trial_ending_email_sent: boolean;
    trial_ended_email_sent: boolean;
    grace_period_reminder_sent: boolean;
  };
  const summaries: TrialUserSummary[] = ((users ?? []) as UserRow[]).map((u) => {
    let graceDay: number | null = null;
    if (u.grace_period_start) {
      const start = new Date(u.grace_period_start);
      graceDay = Math.floor(
        (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return {
      id: u.id,
      email: u.email,
      displayName: u.display_name,
      householdId: u.household_id,
      trialCyclesCompleted: u.trial_cycles_completed ?? 0,
      trialEndedAt: u.trial_ended_at,
      gracePeriodStart: u.grace_period_start,
      trialMilestoneEmailSent: u.trial_milestone_email_sent ?? false,
      trialEndingEmailSent: u.trial_ending_email_sent ?? false,
      trialEndedEmailSent: u.trial_ended_email_sent ?? false,
      gracePeriodReminderSent: u.grace_period_reminder_sent ?? false,
      graceDay,
    };
  });

  return NextResponse.json({ users: summaries });
}
