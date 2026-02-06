import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'PLOT <onboarding@resend.dev>';

function getResendClient(): Resend | null {
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export function isEmailConfigured(): boolean {
  return Boolean(apiKey);
}

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const resend = getResendClient();
  if (!resend) {
    return { success: false, error: 'RESEND_API_KEY is not set' };
  }

  const to = Array.isArray(params.to) ? params.to : [params.to];
  const { data, error } = await resend.emails.send({
    from: params.from ?? fromEmail,
    to,
    subject: params.subject,
    html: params.html,
    ...(params.replyTo && { reply_to: params.replyTo }),
  });

  if (error) {
    return { success: false, error: error.message };
  }
  if (!data?.id) {
    return { success: false, error: 'No email id returned' };
  }
  return { success: true, id: data.id };
}
