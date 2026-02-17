import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { captureServerEvent } from '@/lib/posthog-server';

const FeedbackSchema = z
  .object({
    type: z.enum(['bug', 'feedback']),
    message: z.string().min(1, 'Message is required').max(10000),
    // CSAT-style satisfaction 1–5 (optional); tracked in PostHog for trends
    rating: z.number().int().min(1).max(5).optional(),
    // Bug report context (optional)
    context: z.string().max(500).optional(),
    expected: z.string().max(500).optional(),
    // Feedback category (required when type is feedback)
    category: z
      .enum(['general', 'idea', 'something_wrong', 'praise', 'other'])
      .optional(),
  })
  .refine((data) => data.type !== 'feedback' || data.category != null, {
    message: 'Category is required for feedback',
    path: ['category'],
  });

const FEEDBACK_EMAIL = 'hello@plotbudget.com';
const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  idea: 'Idea / suggestion',
  something_wrong: "Something's wrong",
  praise: 'Praise',
  other: 'Other',
};

type FeedbackParsed = z.infer<typeof FeedbackSchema>;

function buildFeedbackEmailSections(data: FeedbackParsed): string[] {
  const { type, message, rating, context, expected, category } = data;
  const sections: string[] = [];
  if (rating != null) {
    sections.push(`<p><strong>Satisfaction (1–5):</strong> ${rating}</p>`);
  }
  if (type === 'bug') {
    if (context?.trim()) {
      sections.push(`<p><strong>What they were doing:</strong></p><p>${escapeHtml(context.trim())}</p>`);
    }
    if (expected?.trim()) {
      sections.push(`<p><strong>What they expected:</strong></p><p>${escapeHtml(expected.trim())}</p>`);
    }
  } else if (category) {
    const label = CATEGORY_LABELS[category] ?? category;
    sections.push(`<p><strong>Category:</strong> ${escapeHtml(label)}</p>`);
  }
  sections.push(`<p><strong>Message:</strong></p><pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(message)}</pre>`);
  return sections;
}

function buildFeedbackEmailHtml(data: FeedbackParsed, userEmail: string | undefined, userId: string): string {
  const typeLabel = data.type === 'bug' ? 'Bug report' : 'General feedback';
  const sections = buildFeedbackEmailSections(data);
  return `
    <p><strong>${typeLabel}</strong></p>
    <p><strong>From:</strong> ${userEmail ?? 'Unknown'} (user id: ${userId})</p>
    ${sections.join('')}
  `;
}

/**
 * POST /api/feedback
 * Submit bug report or feedback. Authenticated only. Sends email to hello@plotbudget.com.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = first.message?.[0] ?? first.type?.[0] ?? 'Invalid input';
    return NextResponse.json({ error: String(msg) }, { status: 400 });
  }

  const { type, rating, category } = parsed.data;
  const subject =
    type === 'bug'
      ? `[PLOT Feedback] Bug report from ${user.email ?? 'user'}`
      : `[PLOT Feedback] General feedback from ${user.email ?? 'user'}`;
  const html = buildFeedbackEmailHtml(parsed.data, user.email ?? undefined, user.id);

  const result = await sendEmail({
    to: FEEDBACK_EMAIL,
    subject,
    html,
    replyTo: user.email ?? undefined,
  });
  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? 'Failed to send feedback' },
      { status: 500 }
    );
  }

  captureServerEvent({
    distinctId: user.id,
    event: 'feedback_submitted',
    properties: {
      type,
      ...(rating != null && { rating }),
      ...(type === 'feedback' && category && category !== 'general' && { category }),
    },
  });

  return NextResponse.json({ success: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
