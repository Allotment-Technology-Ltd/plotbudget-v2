/**
 * Dev-only API: manipulate trial state for test users.
 * Gated by isTrialTestingDashboardAllowed().
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isTrialTestingDashboardAllowed } from '@/lib/feature-flags';
import { createNextPaycycleCore } from '@/lib/paycycle/create-next-paycycle-core';

const TRIAL_TEST_EMAILS = [
  'trial-milestone@plotbudget.test',
  'trial-ending@plotbudget.test',
  'trial-ended@plotbudget.test',
  'trial-grace@plotbudget.test',
  'trial-archive@plotbudget.test',
];

export type TrialStateAction =
  | 'set-grace-6'
  | 'set-grace-8'
  | 'complete-cycle-1'
  | 'complete-cycle-2'
  | 'simulate-cycle-switchover'
  | 'reset-email-flags';

export async function POST(req: Request) {
  if (!isTrialTestingDashboardAllowed()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const userId = body.userId as string | undefined;
  const action = body.action as TrialStateAction | undefined;

  if (!userId || !action) {
    return NextResponse.json(
      { error: 'userId and action required' },
      { status: 400 }
    );
  }

  const validActions: TrialStateAction[] = [
    'set-grace-6',
    'set-grace-8',
    'complete-cycle-1',
    'complete-cycle-2',
    'simulate-cycle-switchover',
    'reset-email-flags',
  ];
  if (!validActions.includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action', valid: validActions },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Ensure user is a trial test user
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('id, email, household_id')
    .eq('id', userId)
    .single();

  if (fetchError || !userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const user = userData as { id: string; email: string; household_id: string | null };
  if (!TRIAL_TEST_EMAILS.includes(user.email)) {
    return NextResponse.json(
      { error: 'Only trial test users can be manipulated' },
      { status: 403 }
    );
  }

  const now = new Date();

  switch (action) {
    case 'set-grace-6': {
      const sixDaysAgo = new Date(now);
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
      const ts = sixDaysAgo.toISOString();
      const { error } = await supabase
        .from('users')
        .update({
          trial_cycles_completed: 2,
          trial_ended_at: ts,
          grace_period_start: ts,
          trial_ended_email_sent: true,
          grace_period_reminder_sent: false,
          updated_at: now.toISOString(),
        } as never)
        .eq('id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: 'Set grace_period_start to 6 days ago' });
    }

    case 'set-grace-8': {
      const eightDaysAgo = new Date(now);
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
      const ts = eightDaysAgo.toISOString();
      const { error } = await supabase
        .from('users')
        .update({
          trial_cycles_completed: 2,
          trial_ended_at: ts,
          grace_period_start: ts,
          trial_ended_email_sent: true,
          grace_period_reminder_sent: true,
          updated_at: now.toISOString(),
        } as never)
        .eq('id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: 'Set grace_period_start to 8 days ago' });
    }

    case 'complete-cycle-1': {
      const { error } = await supabase
        .from('users')
        .update({
          trial_cycles_completed: 1,
          trial_ended_at: null,
          grace_period_start: null,
          trial_milestone_email_sent: false,
          trial_ending_email_sent: false,
          trial_ended_email_sent: false,
          grace_period_reminder_sent: false,
          updated_at: now.toISOString(),
        } as never)
        .eq('id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: 'Set trial_cycles_completed to 1' });
    }

    case 'complete-cycle-2': {
      const { error } = await supabase
        .from('users')
        .update({
          trial_cycles_completed: 2,
          trial_ended_at: now.toISOString(),
          grace_period_start: now.toISOString(),
          trial_ended_email_sent: false,
          grace_period_reminder_sent: false,
          updated_at: now.toISOString(),
        } as never)
        .eq('id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: 'Set trial_cycles_completed to 2, grace started' });
    }

    case 'simulate-cycle-switchover': {
      const householdId = user.household_id;
      if (!householdId) {
        return NextResponse.json(
          { error: 'User has no household' },
          { status: 400 }
        );
      }

      const { data: activeCycle } = await supabase
        .from('paycycles')
        .select('id')
        .eq('household_id', householdId)
        .eq('status', 'active')
        .maybeSingle();

      if (!activeCycle) {
        return NextResponse.json(
          { error: 'No active paycycle found for this household' },
          { status: 400 }
        );
      }

      const cycle = activeCycle as { id: string };

      const { data: draftCycleData } = await supabase
        .from('paycycles')
        .select('id')
        .eq('household_id', householdId)
        .eq('status', 'draft')
        .maybeSingle();

      const draftCycle = draftCycleData as { id: string } | null;

      let newActiveId: string;

      if (draftCycle) {
        const { error: activateErr } = await supabase
          .from('paycycles')
          .update({ status: 'active', updated_at: now.toISOString() } as never)
          .eq('id', draftCycle.id);
        if (activateErr) {
          return NextResponse.json({ error: activateErr.message }, { status: 500 });
        }
        newActiveId = draftCycle.id;
      } else {
        const result = await createNextPaycycleCore(supabase, cycle.id, {
          status: 'active',
        });
        if (result.error || !result.cycleId) {
          return NextResponse.json(
            { error: result.error ?? 'Failed to create next cycle' },
            { status: 500 }
          );
        }
        newActiveId = result.cycleId;
      }

      const { error: completeErr } = await supabase
        .from('paycycles')
        .update({
          status: 'completed',
          ritual_closed_at: now.toISOString(),
          updated_at: now.toISOString(),
        } as never)
        .eq('id', cycle.id);
      if (completeErr) {
        return NextResponse.json({ error: completeErr.message }, { status: 500 });
      }

      const { data: members } = await supabase
        .from('users')
        .select('id, trial_cycles_completed')
        .eq('household_id', householdId);
      const memberRows = (members ?? []) as { id: string; trial_cycles_completed: number }[];

      for (const member of memberRows) {
        const newCount = Math.min(2, (member.trial_cycles_completed ?? 0) + 1);
        await supabase
          .from('users')
          .update({
            current_paycycle_id: newActiveId,
            trial_cycles_completed: newCount,
            ...(newCount >= 2 && {
              trial_ended_at: now.toISOString(),
              grace_period_start: now.toISOString(),
            }),
            updated_at: now.toISOString(),
          } as never)
          .eq('id', member.id);
      }

      return NextResponse.json({
        success: true,
        message: `Cycle switched: previous marked completed, new active cycle created. trial_cycles_completed incremented.`,
        newCycleId: newActiveId,
      });
    }

    case 'reset-email-flags': {
      const { error } = await supabase
        .from('users')
        .update({
          trial_milestone_email_sent: false,
          trial_ending_email_sent: false,
          trial_ended_email_sent: false,
          grace_period_reminder_sent: false,
          updated_at: now.toISOString(),
        } as never)
        .eq('id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: 'Reset all email flags' });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
