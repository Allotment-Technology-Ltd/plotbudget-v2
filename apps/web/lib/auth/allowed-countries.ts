/**
 * Countries where signup is allowed (UK, EU, USA, Canada).
 * Used with Vercel geo (request.geo.country) or similar.
 * Currencies supported: GBP, USD, EUR (see household currency).
 */

/** ISO 3166-1 alpha-2 country codes where PLOT signup is allowed. */
export const ALLOWED_SIGNUP_COUNTRY_CODES = new Set([
  'GB', // United Kingdom
  'US', // United States
  'CA', // Canada
  // EU member states (27)
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE',
]);

export function isCountryAllowedForSignup(countryCode: string | null | undefined): boolean {
  if (!countryCode || typeof countryCode !== 'string') return true; // Allow when unknown (e.g. local dev)
  return ALLOWED_SIGNUP_COUNTRY_CODES.has(countryCode.toUpperCase());
}

export const REGION_RESTRICTED_MESSAGE =
  'PLOT is currently available in the UK, EU, USA, and Canada. We’re expanding soon—join our waitlist to be notified.';
