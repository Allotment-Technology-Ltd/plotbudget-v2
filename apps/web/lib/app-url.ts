/**
 * Server-side base URL for the app. Used for links in emails (e.g. partner invite).
 * Prefer NEXT_PUBLIC_APP_URL. On Vercel Preview, VERCEL_URL is set (hostname only).
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
