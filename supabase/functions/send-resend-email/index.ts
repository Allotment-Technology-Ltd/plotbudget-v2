/**
 * Supabase Send Email Auth Hook: all auth and security emails via Resend with PLOT branding.
 * Deploy: supabase functions deploy send-resend-email --no-verify-jwt
 * Secrets: RESEND_API_KEY, SEND_EMAIL_HOOK_SECRET, RESEND_FROM_EMAIL (optional), RESEND_REPLY_TO (optional), SUPABASE_URL
 */

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { Resend } from 'npm:resend@4.0.0';
import {
  signupHtml,
  inviteHtml,
  magiclinkHtml,
  emailChangeConfirmHtml,
  recoveryHtml,
  reauthenticationHtml,
  passwordChangedHtml,
  emailChangedHtml,
  phoneChangedHtml,
  identityLinkedHtml,
  identityUnlinkedHtml,
  mfaEnrolledHtml,
  mfaUnenrolledHtml,
  unknownActionHtml,
} from './templates.ts';

const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'PLOT <hello@plotbudget.com>';
const replyTo = Deno.env.get('RESEND_REPLY_TO') ?? 'hello@plotbudget.com';
const supabaseAuthUrl = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/$/, '') + '/auth/v1';

function getHookSecret(): string {
  const raw = Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? '';
  return raw.replace(/^v1,whsec_/, '');
}

interface User {
  email?: string;
  email_new?: string;
  phone?: string;
  user_metadata?: { email?: string };
  userMetadata?: { email?: string };
}

interface EmailData {
  token?: string;
  token_hash?: string;
  token_new?: string;
  token_hash_new?: string;
  redirect_to?: string;
  email_action_type?: string;
  site_url?: string;
  old_email?: string;
  old_phone?: string;
  provider?: string;
  factor_type?: string;
  /** Some payloads put recipient in metadata */
  email?: string;
  to?: string;
}

function buildVerifyUrl(tokenHash: string, type: string, redirectTo: string): string {
  const params = new URLSearchParams();
  params.set('token', tokenHash);
  params.set('type', type);
  if (redirectTo) params.set('redirect_to', redirectTo);
  return `${supabaseAuthUrl}/verify?${params.toString()}`;
}

function errResponse(
  message: string,
  status: number,
  extraHeaders?: Record<string, string>
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers,
  });
}

async function sendOne(
  to: string,
  subject: string,
  html: string
): Promise<{ error?: { message: string } }> {
  const { error } = await resend!.emails.send({
    from: fromEmail,
    to: [to],
    replyTo,
    subject,
    html,
  });
  return { error: error ?? undefined };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return errResponse('Method not allowed', 405);
  }

  const hookSecret = getHookSecret();
  if (!hookSecret || !resend) {
    return errResponse('SEND_EMAIL_HOOK_SECRET or RESEND_API_KEY not set', 500);
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers.entries());
  const wh = new Webhook(hookSecret);

  let user: User;
  let email_data: EmailData;
  let verified: { user: User; email_data?: EmailData; email?: EmailData; [k: string]: unknown } | null = null;
  try {
    verified = wh.verify(payload, headers) as NonNullable<typeof verified>;
    user = verified.user;
    email_data = verified.email_data ?? verified.email ?? {};
  } catch (e) {
    return errResponse('Webhook verification failed', 401);
  }

  const actionType = (email_data.email_action_type ?? '').toLowerCase();
  const redirectTo = email_data.redirect_to ?? email_data.site_url ?? '';
  const token = email_data.token ?? '';
  const tokenHash = email_data.token_hash ?? '';
  const tokenNew = email_data.token_new ?? '';
  const tokenHashNew = email_data.token_hash_new ?? '';
  let userEmail =
    user.email ??
    user.user_metadata?.email ??
    user.userMetadata?.email ??
    email_data.email ??
    email_data.to ??
    '';
  if (!userEmail && payload) {
    try {
      const raw = JSON.parse(payload) as {
        user?: { email?: string; user_metadata?: { email?: string }; userMetadata?: { email?: string } };
        email_data?: { email?: string; to?: string };
        email?: { email?: string; to?: string };
      };
      const u = raw.user;
      const ed = raw.email_data ?? raw.email;
      userEmail =
        u?.email ??
        u?.user_metadata?.email ??
        u?.userMetadata?.email ??
        ed?.email ??
        ed?.to ??
        '';
    } catch {
      /* ignore */
    }
  }
  const userEmailNew = (user as { email_new?: string }).email_new ?? '';
  const oldEmail = email_data.old_email ?? '';
  const oldPhone = email_data.old_phone ?? '';
  const provider = email_data.provider ?? '';
  const factorType = email_data.factor_type ?? '';

  // ---- Email change (secure): 1 or 2 emails ----
  // Doc: token_hash pairs with new email (use with token_new); token_hash_new pairs with current (use with token).
  if (actionType === 'email_change') {
    const toNew = userEmailNew || userEmail;
    // Email 1: to new address — use token_new + token_hash
    if (tokenNew && tokenHash && toNew) {
      const url = buildVerifyUrl(tokenHash, 'email_change', redirectTo);
      const html = emailChangeConfirmHtml(url, tokenNew);
      const res = await sendOne(toNew, 'Confirm your new email for PLOT', html);
      if (res.error) {
        const msg = res.error.message ?? 'Resend API error';
        return errResponse(msg, 502, { 'X-Resend-Error': msg.slice(0, 200) });
      }
    }
    // Email 2: to current address — use token + token_hash_new (confirm from current inbox)
    if (token && tokenHashNew && userEmail && toNew && userEmail !== toNew) {
      const url = buildVerifyUrl(tokenHashNew, 'email_change', redirectTo);
      const html = emailChangeConfirmHtml(url, token);
      const res = await sendOne(userEmail, 'Confirm your email change for PLOT', html);
      if (res.error) {
        const msg = res.error.message ?? 'Resend API error';
        return errResponse(msg, 502, { 'X-Resend-Error': msg.slice(0, 200) });
      }
    }
    // Secure change disabled: single email to new address
    if (!tokenNew && token && tokenHash && userEmail) {
      const url = buildVerifyUrl(tokenHash, 'email_change', redirectTo);
      const html = emailChangeConfirmHtml(url, token);
      const res = await sendOne(userEmail, 'Confirm your new email for PLOT', html);
      if (res.error) {
        const msg = res.error.message ?? 'Resend API error';
        return errResponse(msg, 502, { 'X-Resend-Error': msg.slice(0, 200) });
      }
    }
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ---- Single-recipient auth and security ----
  let to = userEmail;
  let subject = 'PLOT';
  let html = unknownActionHtml(actionType);

  switch (actionType) {
    case 'signup': {
      const url = buildVerifyUrl(tokenHash, 'signup', redirectTo);
      subject = 'Confirm your email for PLOT';
      html = signupHtml(url, token);
      break;
    }
    case 'invite': {
      const url = buildVerifyUrl(tokenHash, 'invite', redirectTo);
      subject = "You're invited to PLOT";
      html = inviteHtml(url);
      break;
    }
    case 'magiclink': {
      const url = buildVerifyUrl(tokenHash, 'magiclink', redirectTo);
      subject = 'Your PLOT sign-in link';
      html = magiclinkHtml(url, token);
      break;
    }
    case 'recovery': {
      const url = buildVerifyUrl(tokenHash, 'recovery', redirectTo);
      subject = 'Reset your PLOT password';
      html = recoveryHtml(url, token);
      break;
    }
    case 'reauthentication': {
      subject = 'Your PLOT verification code';
      html = reauthenticationHtml(token);
      break;
    }
    case 'password_changed':
    case 'password_changed_notification': {
      subject = 'Your PLOT password was changed';
      html = passwordChangedHtml(userEmail);
      break;
    }
    case 'email_changed_notification': {
      subject = 'Your PLOT email address was changed';
      html = emailChangedHtml(oldEmail, userEmail);
      break;
    }
    case 'phone_changed':
    case 'phone_changed_notification': {
      subject = 'Your PLOT phone number was changed';
      html = phoneChangedHtml(userEmail, oldPhone, user.phone ?? '');
      break;
    }
    case 'identity_linked':
    case 'identity_linked_notification': {
      subject = 'A sign-in method was linked to your PLOT account';
      html = identityLinkedHtml(userEmail, provider);
      break;
    }
    case 'identity_unlinked':
    case 'identity_unlinked_notification': {
      subject = 'A sign-in method was unlinked from your PLOT account';
      html = identityUnlinkedHtml(userEmail, provider);
      break;
    }
    case 'mfa_factor_enrolled':
    case 'mfa_factor_enrolled_notification': {
      subject = 'A sign-in step was added to your PLOT account';
      html = mfaEnrolledHtml(userEmail, factorType);
      break;
    }
    case 'mfa_factor_unenrolled':
    case 'mfa_factor_unenrolled_notification': {
      subject = 'A sign-in step was removed from your PLOT account';
      html = mfaUnenrolledHtml(userEmail, factorType);
      break;
    }
    default:
      subject = `PLOT: ${actionType || 'notification'}`;
      html = unknownActionHtml(actionType || 'unknown');
  }

  if (!to) {
    return errResponse('No recipient email', 400);
  }

  const result = await sendOne(to, subject, html);
  if (result.error) {
    const msg = result.error.message ?? 'Resend API error';
    return errResponse(msg, 502, {
      'X-Resend-Error': msg.slice(0, 200),
    });
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
