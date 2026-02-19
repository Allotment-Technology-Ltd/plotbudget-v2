/**
 * Cross-origin theme persistence between marketing (plotbudget.com) and app (app.plotbudget.com).
 * Cookie with domain=.plotbudget.com is readable by both; localStorage is origin-specific.
 */

const COOKIE_NAME = 'plot-theme';
const MAX_AGE = 365 * 24 * 60 * 60; // 1 year

function isPlotbudgetDomain(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'plotbudget.com' || h === 'app.plotbudget.com' || h.endsWith('.plotbudget.com');
}

/**
 * Read theme from cookie. Safe to call on server (returns null).
 */
export function getThemeCookie(): 'light' | 'dark' | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const v = m?.[1]?.toLowerCase();
  return v === 'light' || v === 'dark' ? v : null;
}

/**
 * Write theme to cookie. In production (plotbudget.com / app.plotbudget.com) sets domain=.plotbudget.com so both sites share it.
 */
export function setThemeCookie(value: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const domain = isPlotbudgetDomain() ? `; domain=.plotbudget.com` : '';
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${MAX_AGE}; SameSite=Lax${domain}`;
}
