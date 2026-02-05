/**
 * Email allowlist for private beta access
 * Checks if an email is authorized to create an account
 */
export function isEmailAllowed(email: string): boolean {
  const allowedEmails = process.env.ALLOWED_EMAILS
    ?.split(',')
    .map((e) => e.trim().toLowerCase()) || [];

  if (allowedEmails.length === 0) {
    console.warn('⚠️  ALLOWED_EMAILS not configured - denying all signups');
    return false;
  }

  return allowedEmails.includes(email.toLowerCase());
}

export const ALLOWLIST_ERROR_MESSAGE =
  'PlotBudget is currently in private beta. Please contact support for access.';
