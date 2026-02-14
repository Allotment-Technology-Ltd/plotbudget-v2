/**
 * PLOT-branded HTML email fragments for Supabase Auth hook.
 * Aligned with apps/web/emails (EmailLayout, styles).
 */

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif';
const COLORS = {
  bg: '#F5F0EA',
  container: '#ffffff',
  text: '#111111',
  body: '#404040',
  footer: '#666666',
  border: '#e6e6e6',
  link: '#0E8345',
} as const;

function wrapBody(inner: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${COLORS.bg};font-family:${FONT_FAMILY};">
  <div style="max-width:600px;margin:0 auto;padding:20px 0;background-color:${COLORS.container};">
    <div style="margin:20px 0;font-size:24px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:${COLORS.text};">PLOT</div>
    ${inner}
    <hr style="border:0;border-top:1px solid ${COLORS.border};margin:26px 0;" />
    <p style="color:${COLORS.footer};font-size:12px;line-height:16px;margin:8px 0;">
      Questions? Just reply to this email or visit <a href="https://plotbudget.com/help" style="color:${COLORS.link};text-decoration:underline;">plotbudget.com/help</a>
    </p>
    <p style="color:${COLORS.footer};font-size:12px;line-height:16px;margin:8px 0;">PLOT Team<br/>hello@plotbudget.com</p>
  </div>
</body>
</html>`;
}

function linkButton(href: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${escapeHtml(href)}" style="background-color:${COLORS.text};border-radius:6px;color:#fff;font-size:16px;font-weight:bold;text-decoration:none;text-align:center;display:inline-block;padding:12px 24px;">${escapeHtml(label)}</a></p>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Confirm sign up */
export function signupHtml(confirmUrl: string, token: string): string {
  const inner = `
    <p style="color:${COLORS.body};font-size:16px;line-height:24px;margin:16px 0;">Confirm your email to start budgeting with PLOT.</p>
    ${linkButton(confirmUrl, 'Confirm email')}
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">Or enter this code in the app: <strong>${escapeHtml(token)}</strong></p>
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">If you didn't sign up for PLOT, you can ignore this email.</p>`;
  return wrapBody(inner);
}

/** Invite user */
export function inviteHtml(inviteUrl: string): string {
  const inner = `
    <p style="color:${COLORS.body};font-size:16px;line-height:24px;margin:16px 0;">You've been invited to join a household on PLOT.</p>
    ${linkButton(inviteUrl, 'Accept invitation')}
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">If you didn't expect this email, you can ignore it.</p>`;
  return wrapBody(inner);
}

/** Magic link */
export function magiclinkHtml(loginUrl: string, token: string): string {
  const inner = `
    <p style="color:${COLORS.body};font-size:16px;line-height:24px;margin:16px 0;">Use this link to sign in to PLOT.</p>
    ${linkButton(loginUrl, 'Sign in')}
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">Or enter this code: <strong>${escapeHtml(token)}</strong></p>
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">If you didn't request this, you can ignore this email.</p>`;
  return wrapBody(inner);
}

/** Change email address (confirmation to new email) */
export function emailChangeConfirmHtml(confirmUrl: string, token: string): string {
  const inner = `
    <p style="color:${COLORS.body};font-size:16px;line-height:24px;margin:16px 0;">Confirm your new email address for PLOT.</p>
    ${linkButton(confirmUrl, 'Confirm new email')}
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">Or enter this code: <strong>${escapeHtml(token)}</strong></p>
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">If you didn't request this change, you can ignore this email.</p>`;
  return wrapBody(inner);
}

/** Reset password */
export function recoveryHtml(resetUrl: string, token: string): string {
  const inner = `
    <p style="color:${COLORS.body};font-size:16px;line-height:24px;margin:16px 0;">Reset your PLOT password using the link below.</p>
    ${linkButton(resetUrl, 'Reset password')}
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">Or enter this code: <strong>${escapeHtml(token)}</strong></p>
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">If you didn't request a reset, you can ignore this email.</p>`;
  return wrapBody(inner);
}

/** Reauthentication (OTP) */
export function reauthenticationHtml(token: string): string {
  const inner = `
    <p style="color:${COLORS.body};font-size:16px;line-height:24px;margin:16px 0;">Enter this code to continue:</p>
    <p style="color:${COLORS.body};font-size:18px;font-weight:bold;margin:16px 0;letter-spacing:2px;">${escapeHtml(token)}</p>
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">If you didn't request this, you can ignore this email.</p>`;
  return wrapBody(inner);
}

/** Security: password changed */
export function passwordChangedHtml(email: string): string {
  const inner = `
    <p style="color:${COLORS.body};font-size:16px;line-height:24px;margin:16px 0;">The password for your PLOT account (${escapeHtml(email)}) was recently changed.</p>
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">If you didn't make this change, please contact us at hello@plotbudget.com or visit plotbudget.com/help.</p>`;
  return wrapBody(inner);
}

/** Security: email address changed */
export function emailChangedHtml(oldEmail: string, newEmail: string): string {
  const inner = `
    <p style="color:${COLORS.body};font-size:16px;line-height:24px;margin:16px 0;">The email address for your PLOT account was changed from ${escapeHtml(oldEmail)} to ${escapeHtml(newEmail)}.</p>
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">If you didn't make this change, please contact us at hello@plotbudget.com or visit plotbudget.com/help.</p>`;
  return wrapBody(inner);
}

/** Security: phone number changed */
export function phoneChangedHtml(email: string, oldPhone: string, newPhone: string): string {
  const inner = `
    <p style="color:${COLORS.body};font-size:16px;line-height:24px;margin:16px 0;">The phone number for your PLOT account (${escapeHtml(email)}) was changed from ${escapeHtml(oldPhone)} to ${escapeHtml(newPhone)}.</p>
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">If you didn't make this change, please contact us at hello@plotbudget.com immediately.</p>`;
  return wrapBody(inner);
}

/** Security: identity linked */
export function identityLinkedHtml(email: string, provider: string): string {
  const inner = `
    <p style="color:${COLORS.body};font-size:16px;line-height:24px;margin:16px 0;">A new sign-in method (${escapeHtml(provider)}) was linked to your PLOT account (${escapeHtml(email)}).</p>
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">If you didn't do this, please contact us at hello@plotbudget.com or visit plotbudget.com/help.</p>`;
  return wrapBody(inner);
}

/** Security: identity unlinked */
export function identityUnlinkedHtml(email: string, provider: string): string {
  const inner = `
    <p style="color:${COLORS.body};font-size:16px;line-height:24px;margin:16px 0;">A sign-in method (${escapeHtml(provider)}) was unlinked from your PLOT account (${escapeHtml(email)}).</p>
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">If you didn't do this, please contact us at hello@plotbudget.com or visit plotbudget.com/help.</p>`;
  return wrapBody(inner);
}

/** Security: MFA factor enrolled */
export function mfaEnrolledHtml(email: string, factorType: string): string {
  const inner = `
    <p style="color:${COLORS.body};font-size:16px;line-height:24px;margin:16px 0;">A new sign-in step (${escapeHtml(factorType)}) was added to your PLOT account (${escapeHtml(email)}).</p>
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">If you didn't do this, please contact us at hello@plotbudget.com immediately.</p>`;
  return wrapBody(inner);
}

/** Security: MFA factor unenrolled */
export function mfaUnenrolledHtml(email: string, factorType: string): string {
  const inner = `
    <p style="color:${COLORS.body};font-size:16px;line-height:24px;margin:16px 0;">A sign-in step (${escapeHtml(factorType)}) was removed from your PLOT account (${escapeHtml(email)}).</p>
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">If you didn't do this, please contact us at hello@plotbudget.com immediately.</p>`;
  return wrapBody(inner);
}

/** Fallback for unknown action type */
export function unknownActionHtml(actionType: string): string {
  const inner = `
    <p style="color:${COLORS.body};font-size:16px;line-height:24px;margin:16px 0;">You have a request from PLOT (action: ${escapeHtml(actionType)}).</p>
    <p style="color:${COLORS.body};font-size:14px;line-height:20px;margin:8px 0;">If you have questions, reply to this email or visit plotbudget.com/help.</p>`;
  return wrapBody(inner);
}
