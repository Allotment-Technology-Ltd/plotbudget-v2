/**
 * Cookie used to redirect the user after OAuth or magic-link callback.
 * Set before redirecting to provider/OTP; read in /auth/callback.
 */
export const REDIRECT_AFTER_AUTH_COOKIE = 'redirect_after_auth';
export const REDIRECT_AFTER_AUTH_MAX_AGE_SEC = 60 * 10; // 10 minutes

/** Set the redirect-after-auth cookie (client-side only). Call before OAuth or magic link. */
export function setRedirectAfterAuthCookie(redirectPath: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${REDIRECT_AFTER_AUTH_COOKIE}=${encodeURIComponent(redirectPath)}; path=/; max-age=${REDIRECT_AFTER_AUTH_MAX_AGE_SEC}; samesite=lax`;
}
