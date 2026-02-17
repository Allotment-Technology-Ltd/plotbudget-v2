/**
 * Persist which login method the user last used, so we can highlight it on the
 * login hub (Linear-style "You used X to log in last time").
 */
const STORAGE_KEY = 'plot-last-login-method';

export type LastLoginMethod = 'google' | 'apple' | 'email' | 'magic_link';

export function getLastLoginMethod(): LastLoginMethod | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'google' || stored === 'apple' || stored === 'email' || stored === 'magic_link') return stored;
    return null;
  } catch {
    return null;
  }
}

export function setLastLoginMethod(method: LastLoginMethod): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, method);
  } catch {
    // ignore
  }
}

export function getLastLoginMethodLabel(method: LastLoginMethod): string {
  switch (method) {
    case 'google':
      return 'Google';
    case 'apple':
      return 'Apple';
    case 'email':
      return 'email';
    case 'magic_link':
      return 'your sign-in link';
    default:
      return '';
  }
}
