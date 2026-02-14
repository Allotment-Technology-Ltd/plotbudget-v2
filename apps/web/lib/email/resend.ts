import { Resend } from 'resend';

const DEFAULT_FROM = 'PLOT <hello@plotbudget.com>';
const DEFAULT_REPLY_TO = 'hello@plotbudget.com';

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/** Use verified plotbudget.com; avoid unverified app.plotbudget.com. */
function normalizeFrom(from: string): string {
  if (from.includes('@app.plotbudget.com')) {
    return DEFAULT_FROM;
  }
  return from;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
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

  const rawFrom =
    params.from ??
    process.env.RESEND_FROM_EMAIL ??
    DEFAULT_FROM;
  const from = normalizeFrom(rawFrom);
  const replyTo =
    params.replyTo ??
    process.env.RESEND_REPLY_TO ??
    DEFAULT_REPLY_TO;

  const to = Array.isArray(params.to) ? params.to : [params.to];
  const { data, error } = await resend.emails.send({
    from,
    to,
    replyTo,
    subject: params.subject,
    html: params.html,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  if (!data?.id) {
    return { success: false, error: 'No email id returned' };
  }
  return { success: true, id: data.id };
}
