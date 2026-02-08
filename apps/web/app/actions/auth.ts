'use server';

import { cookies } from 'next/headers';
import { isEmailAllowed } from '@/lib/auth/allowlist';
import { isCountryAllowedForSignup } from '@/lib/auth/allowed-countries';

const COUNTRY_COOKIE_NAME = 'x-plot-country';

export async function checkEmailAllowed(email: string): Promise<boolean> {
  return isEmailAllowed(email);
}

/** Returns whether signup is allowed based on request country (set by middleware from geo). */
export async function getSignupRegionAllowed(): Promise<{
  allowed: boolean;
  country: string | null;
}> {
  const cookieStore = await cookies();
  const country = cookieStore.get(COUNTRY_COOKIE_NAME)?.value ?? null;
  return {
    allowed: isCountryAllowedForSignup(country),
    country: country || null,
  };
}
