/**
 * Trial transition email helpers.
 * Renders templates and sends via Resend.
 */
import React from 'react';
import { render } from '@react-email/render';
import { sendEmail, isEmailConfigured } from './resend';

const FREE_TIER_LIMITS = { pots: 2, repayments: 2, needs: 5, wants: 5 };

export type TrialMilestoneParams = {
  email: string;
  displayName: string;
  cyclesCompleted: number;
  totalCycles: number;
  nextCycleEndsOn?: string | null;
};

export type TrialEndingSoonParams = {
  email: string;
  displayName: string;
  daysRemaining: number;
  trialEndsOn?: string | null;
  currentCounts?: { pots?: number; repayments?: number; needs?: number; wants?: number };
  freeTierLimits?: typeof FREE_TIER_LIMITS;
};

export type TrialEndedParams = {
  email: string;
  displayName: string;
  overPots: number;
  overRepayments: number;
  graceDays?: number;
};

export type GraceReminderParams = {
  email: string;
  displayName: string;
  graceDay?: number;
};

export type FoundingMemberEndingSoonParams = {
  email: string;
  displayName: string;
  foundingMemberEndsOn: string;
};

export async function sendFoundingMemberEndingSoonEmail(
  params: FoundingMemberEndingSoonParams
) {
  const { default: FoundingMemberEndingSoonEmail } = await import(
    '@/emails/founding-member/ending-soon'
  );
  const html = await render(
    React.createElement(FoundingMemberEndingSoonEmail, {
      displayName: params.displayName,
      foundingMemberEndsOn: params.foundingMemberEndsOn,
    })
  );
  return sendEmail({
    to: params.email,
    subject: 'Your Founding Member period ends in about a month',
    html,
  });
}

export async function sendTrialMilestoneEmail(params: TrialMilestoneParams) {
  const { default: TrialMilestoneEmail } = await import('@/emails/trial/milestone');
  const html = await render(
    React.createElement(TrialMilestoneEmail, {
      displayName: params.displayName,
      cyclesCompleted: params.cyclesCompleted,
      totalCycles: params.totalCycles,
      nextCycleEndsOn: params.nextCycleEndsOn,
    })
  );
  return sendEmail({
    to: params.email,
    subject: 'PLOT Trial Update - Halfway there!',
    html,
  });
}

export async function sendTrialEndingSoonEmail(params: TrialEndingSoonParams) {
  const { default: TrialEndingSoonEmail } = await import('@/emails/trial/ending-soon');
  const html = await render(
    React.createElement(TrialEndingSoonEmail, {
      displayName: params.displayName,
      daysRemaining: params.daysRemaining,
      trialEndsOn: params.trialEndsOn,
      currentCounts: params.currentCounts ?? {},
      freeTierLimits: params.freeTierLimits ?? FREE_TIER_LIMITS,
    })
  );
  return sendEmail({
    to: params.email,
    subject: '⏰ Your PLOT trial ends in 3 days',
    html,
  });
}

export async function sendTrialEndedEmail(params: TrialEndedParams) {
  const { default: TrialEndedActionRequiredEmail } = await import(
    '@/emails/trial/ended-action-required'
  );
  const html = await render(
    React.createElement(TrialEndedActionRequiredEmail, {
      displayName: params.displayName,
      overPots: params.overPots,
      overRepayments: params.overRepayments ?? 0,
      graceDays: params.graceDays ?? 7,
    })
  );
  return sendEmail({
    to: params.email,
    subject: 'Your PLOT trial has ended - Action required',
    html,
  });
}

export async function sendGraceReminderEmail(params: GraceReminderParams) {
  const { default: GraceReminderEmail } = await import('@/emails/trial/grace-reminder');
  const html = await render(
    React.createElement(GraceReminderEmail, {
      displayName: params.displayName,
      graceDay: params.graceDay ?? 6,
    })
  );
  return sendEmail({
    to: params.email,
    subject: 'Final reminder: Reduce your pots or upgrade (tomorrow)',
    html,
  });
}

export { isEmailConfigured };
