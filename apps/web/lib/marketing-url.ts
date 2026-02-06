/**
 * Base URL for the marketing site (plotbudget.com).
 * Used for cross-links: Privacy, Terms, Pricing, Help.
 */
export const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL ?? 'https://plotbudget.com';

export function marketingUrl(path: string): string {
  const base = MARKETING_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
