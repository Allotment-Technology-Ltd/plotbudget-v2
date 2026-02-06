import { getAppBaseUrl } from '@/lib/app-url';
import { sendEmail } from './resend';

/**
 * Send partner invite email with join link. Works in local, Vercel preview, and production
 * when RESEND_API_KEY and RESEND_FROM_EMAIL are set.
 */
export async function sendPartnerInviteEmail(
  partnerEmail: string,
  inviterEmail: string,
  token: string
): Promise<void> {
  const baseUrl = getAppBaseUrl();
  const joinUrl = `${baseUrl}/partner/join?t=${encodeURIComponent(token)}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #333;">
  <p>You've been invited to join a household on PLOT Budget.</p>
  <p>Your partner (${inviterEmail}) wants to budget together.</p>
  <p><a href="${joinUrl}" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">Accept invitation</a></p>
  <p>Or copy this link:</p>
  <p style="word-break: break-all;">${joinUrl}</p>
  <p style="margin-top: 2em; font-size: 0.9em; color: #666;">If you didn't expect this email, you can ignore it.</p>
</body>
</html>
`.trim();

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
