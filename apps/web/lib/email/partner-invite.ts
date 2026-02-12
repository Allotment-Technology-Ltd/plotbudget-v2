import { render } from '@react-email/render';
import React from 'react';
import { getAppBaseUrl } from '@/lib/app-url';
import PartnerInviteEmail from '@/emails/partner-invite';
import { sendEmail } from './resend';

/**
 * Send partner invite email with join link. Works in local, Vercel preview, and production
 * when RESEND_API_KEY and RESEND_FROM_EMAIL are set.
 * Uses branded React Email template aligned with PLOT design system.
 */
export async function sendPartnerInviteEmail(
  partnerEmail: string,
  inviterEmail: string,
  token: string
): Promise<void> {
  const baseUrl = getAppBaseUrl();
  const joinUrl = `${baseUrl}/partner/join?t=${encodeURIComponent(token)}`;

  const html = await render(
    React.createElement(PartnerInviteEmail, {
      inviterEmail,
      joinUrl,
    })
  );

  const replyTo = process.env.RESEND_REPLY_TO;
  const result = await sendEmail({
    to: partnerEmail,
    subject: 'You\'re invited to budget together on PLOT',
    html,
    ...(replyTo && { replyTo }),
  });

  if (!result.success) {
    throw new Error(result.error ?? 'Failed to send invite email');
  }
}
