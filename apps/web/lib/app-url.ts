/**
 * Base URL for the app (used in emails, sign-out redirect, and any link that should stay in the current deployment).
 * Prefer NEXT_PUBLIC_APP_URL when set (e.g. in Production). On Preview, next.config sets it from VERCEL_URL at build time so client and server use the preview URL.
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}
