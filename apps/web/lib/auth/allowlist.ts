import { isPreProdContext } from '@/lib/feature-flags';

/**
 * Optional email allowlist for invite-only mode.
 * When ALLOWED_EMAILS is not set or empty, all signups are allowed (public launch).
 * When set (comma-separated), only those emails can sign up.
 * In pre-production (local, Vercel preview, APP_ENV=preview|staging) the allowlist is not enforced; all emails are allowed.
 */
export function isEmailAllowed(email: string): boolean {
  if (isPreProdContext()) {
    return true;
  }
  const list = process.env.ALLOWED_EMAILS?.trim();
  if (!list) {
    return true; // No allowlist: public signups
  }
  const allowedEmails = list.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (allowedEmails.length === 0) {
    return true;
  }
  return allowedEmails.includes(email.toLowerCase());
}

export const ALLOWLIST_ERROR_MESSAGE =
  'This email is not on the invite list. Please contact support for access.';
