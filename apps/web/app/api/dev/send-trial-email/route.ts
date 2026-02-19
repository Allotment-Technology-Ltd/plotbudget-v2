/**
 * Dev-only API: send or preview trial email templates.
 * Gated by isTrialTestingDashboardAllowed().
 */
import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import React from 'react';
import { allowTrialTestingOrAdmin } from '@/lib/auth/admin-gate';
import { sendEmail, isEmailConfigured } from '@/lib/email/resend';

export type TrialEmailTemplate =
  | 'milestone'
  | 'ending-soon'
  | 'ended-action-required'
  | 'grace-reminder'
  | 'pwyl-welcome-paid'
  | 'pwyl-welcome-free';

const SAMPLE_PROPS: Record<
  TrialEmailTemplate,
  { subject: string; props: Record<string, unknown> }
> = {
  milestone: {
    subject: '[PLOT Dev] Trial milestone (1 of 2)',
    props: {
      displayName: 'Alex',
      cyclesCompleted: 1,
      totalCycles: 2,
      nextCycleEndsOn: '28 February 2026',
    },
  },
  'ending-soon': {
    subject: '[PLOT Dev] Trial ending soon',
    props: {
      displayName: 'Alex',
      daysRemaining: 3,
      trialEndsOn: '15 March 2026',
      currentCounts: { pots: 3, repayments: 1, needs: 4, wants: 6 },
      freeTierLimits: { pots: 2, repayments: 2, needs: 5, wants: 5 },
    },
  },
  'ended-action-required': {
    subject: '[PLOT Dev] Trial ended — action required',
    props: {
      displayName: 'Alex',
      overPots: 1,
      overRepayments: 0,
      graceDays: 7,
    },
  },
  'grace-reminder': {
    subject: '[PLOT Dev] Grace period reminder',
    props: {
      displayName: 'Alex',
      graceDay: 6,
    },
  },
  'pwyl-welcome-paid': {
    subject: '[PLOT Dev] PWYL welcome (paid)',
    props: {
      displayName: 'Alex',
      amount: 5,
    },
  },
  'pwyl-welcome-free': {
    subject: '[PLOT Dev] PWYL welcome (free)',
    props: {
      displayName: 'Alex',
      amount: 0,
    },
  },
};

/** GET: return app email config status for the trial-testing UI. */
export async function GET() {
  if (!(await allowTrialTestingOrAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const configured = isEmailConfigured();
  return NextResponse.json({
    emailConfigured: configured,
    hint: configured
      ? undefined
      : 'Add RESEND_API_KEY to apps/web/.env.local (same key as in Supabase Edge Function secrets). Restart dev server after changing .env.local.',
  });
}

export async function POST(req: Request) {
  if (!(await allowTrialTestingOrAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const template = body.template as TrialEmailTemplate | undefined;
  const to = (body.to as string)?.trim();
  const preview = body.preview === true;

  if (!template || !SAMPLE_PROPS[template]) {
    return NextResponse.json(
      { error: 'Invalid template', valid: Object.keys(SAMPLE_PROPS) },
      { status: 400 }
    );
  }

  const { subject, props } = SAMPLE_PROPS[template];

  let html: string;
  try {
    const EmailComponent = await loadTemplate(template);
    html = await render(React.createElement(EmailComponent, props as never));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to render template';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (preview) {
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (!to) {
    return NextResponse.json({ error: 'Recipient email required' }, { status: 400 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          'RESEND_API_KEY not set. Add it to apps/web/.env.local (use the same key as in Supabase secrets). Restart dev server after changing .env.local.',
      },
      { status: 500 }
    );
  }

  const result = await sendEmail({ to, subject, html });
  if (!result.success) {
    // Log so user can see exact Resend error in terminal (pnpm dev)
    console.error('[send-trial-email] Resend failed:', result.error);
    return NextResponse.json(
      {
        error: result.error,
        hint:
          result.error?.toLowerCase().includes('domain') || result.error?.toLowerCase().includes('verif')
            ? 'Send from hello@plotbudget.com and verify plotbudget.com at resend.com/domains.'
            : undefined,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, id: result.id });
}

async function loadTemplate(
  template: TrialEmailTemplate
): Promise<React.ComponentType<Record<string, unknown>>> {
  type EmailComponent = React.ComponentType<Record<string, unknown>>;
  switch (template) {
    case 'milestone':
      return (await import('@/emails/trial/milestone')).default as unknown as EmailComponent;
    case 'ending-soon':
      return (await import('@/emails/trial/ending-soon')).default as unknown as EmailComponent;
    case 'ended-action-required':
      return (await import('@/emails/trial/ended-action-required')).default as unknown as EmailComponent;
    case 'grace-reminder':
      return (await import('@/emails/trial/grace-reminder')).default as unknown as EmailComponent;
    case 'pwyl-welcome-paid':
    case 'pwyl-welcome-free':
      return (await import('@/emails/subscription/pwyl-welcome')).default as unknown as EmailComponent;
    default:
      throw new Error(`Unknown template: ${template}`);
  }
}
