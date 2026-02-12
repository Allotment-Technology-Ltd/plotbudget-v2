/**
 * Send one of each transactional email to hello@plotbudget.com for review.
 * Requires RESEND_API_KEY and RESEND_FROM_EMAIL in .env.local.
 *
 * Run from repo root: pnpm --filter @repo/web send-email-examples
 * Or from apps/web: pnpm run send-email-examples
 */
import path from 'path';
import { config } from 'dotenv';
import { render } from '@react-email/render';
import React from 'react';

config({ path: path.resolve(process.cwd(), '.env.local') });

const TO = 'hello@plotbudget.com';

async function main() {
  const { sendEmail } = await import('../lib/email/resend');
  const { isEmailConfigured } = await import('../lib/email/resend');
  const { sendPartnerInviteEmail } = await import('../lib/email/partner-invite');

  if (!isEmailConfigured()) {
    console.error('RESEND_API_KEY is not set. Add it to .env.local and try again.');
    process.exit(1);
  }

  const emails: Array<{ subject: string; html: string }> = [];

  // 1. Partner invite (use existing sender)
  try {
    await sendPartnerInviteEmail(TO, 'alex@example.com', 'sample-token-for-preview');
    console.log('Sent: Partner invite');
    await new Promise((r) => setTimeout(r, 600)); // rate limit
  } catch (e) {
    console.error('Failed to send partner invite:', e);
  }

  // 2. Trial ending soon
  const TrialEndingSoonEmail = (await import('../emails/trial/ending-soon')).default;
  const endingSoonHtml = await render(
    React.createElement(TrialEndingSoonEmail, {
      displayName: 'Alex',
      daysRemaining: 3,
      trialEndsOn: '15 March 2026',
      currentCounts: { pots: 3, repayments: 1, needs: 4, wants: 6 },
      freeTierLimits: { pots: 2, repayments: 2, needs: 5, wants: 5 },
    })
  );
  emails.push({ subject: '[PLOT Examples] Trial ending soon', html: endingSoonHtml });

  // 3. Trial ended — action required
  const TrialEndedActionRequiredEmail = (await import('../emails/trial/ended-action-required')).default;
  const endedHtml = await render(
    React.createElement(TrialEndedActionRequiredEmail, {
      displayName: 'Alex',
      overPots: 1,
      overRepayments: 0,
      graceDays: 7,
    })
  );
  emails.push({ subject: '[PLOT Examples] Trial ended — action required', html: endedHtml });

  // 4. Grace period reminder
  const GraceReminderEmail = (await import('../emails/trial/grace-reminder')).default;
  const graceHtml = await render(
    React.createElement(GraceReminderEmail, { displayName: 'Alex', graceDay: 6 })
  );
  emails.push({ subject: '[PLOT Examples] Grace period reminder', html: graceHtml });

  // 5. Trial milestone
  const TrialMilestoneEmail = (await import('../emails/trial/milestone')).default;
  const milestoneHtml = await render(
    React.createElement(TrialMilestoneEmail, {
      displayName: 'Alex',
      cyclesCompleted: 1,
      totalCycles: 2,
      nextCycleEndsOn: '28 February 2026',
    })
  );
  emails.push({ subject: '[PLOT Examples] Trial milestone (1 of 2)', html: milestoneHtml });

  // 6. PWYL welcome (paid)
  const PWYLWelcomeEmail = (await import('../emails/subscription/pwyl-welcome')).default;
  const pwylPaidHtml = await render(
    React.createElement(PWYLWelcomeEmail, { displayName: 'Alex', amount: 5 })
  );
  emails.push({ subject: '[PLOT Examples] PWYL welcome (paid)', html: pwylPaidHtml });

  // 7. PWYL welcome (free / £0)
  const pwylFreeHtml = await render(
    React.createElement(PWYLWelcomeEmail, { displayName: 'Alex', amount: 0 })
  );
  emails.push({ subject: '[PLOT Examples] PWYL welcome (free)', html: pwylFreeHtml });

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
  for (const { subject, html } of emails) {
    const result = await sendEmail({ to: TO, subject, html });
    if (result.success) {
      console.log('Sent:', subject);
    } else {
      console.error('Failed:', subject, result.error);
    }
    await delay(600); // Resend limit: 2 req/s
  }

  console.log('\nDone. Check hello@plotbudget.com for the example emails.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
