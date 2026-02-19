'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';
import { getThemeCookie, setThemeCookie } from '@/lib/theme-cookie';

/**
 * Syncs theme between app and marketing via shared cookie (plot-theme, domain=.plotbudget.com).
 * - On mount: if cookie is set, apply it so marketing choice persists into app.
 * - On theme change: write cookie so app choice persists when user visits marketing.
 */
export function ThemeSync() {
  const { setTheme, resolvedTheme } = useTheme();
  const hasAppliedCookie = useRef(false);

  // Apply cookie value on mount so marketing preference is used in app
  useEffect(() => {
    if (hasAppliedCookie.current) return;
    const cookie = getThemeCookie();
    if (cookie) {
      setTheme(cookie);
      hasAppliedCookie.current = true;
    }
  }, [setTheme]);

  // Persist resolved theme to cookie so app preference is used on marketing
  useEffect(() => {
    if (resolvedTheme === 'light' || resolvedTheme === 'dark') {
      setThemeCookie(resolvedTheme);
    }
  }, [resolvedTheme]);

  return null;
}
