import { useState, useEffect, useCallback } from 'react';
import { getThemeCookie, setThemeCookie } from '../lib/theme-cookie';

/**
 * useTheme — Custom hook for managing PLOT's dual-mode theme.
 *
 * Behaviour:
 *  1. On first load, checks shared cookie (plot-theme) then localStorage, then OS preference.
 *  2. Cookie is used so theme persists from marketing → app and app → marketing (same domain).
 *  3. Persists the user's choice to cookie + localStorage on every toggle.
 *  4. Listens for OS-level theme changes ONLY if the user hasn't manually overridden (cookie or localStorage).
 *  5. Adds/removes the .dark class on <html> (used by Tailwind + CSS vars).
 *
 * Returns:
 *  - theme:  'light' | 'dark'
 *  - isDark: boolean shorthand
 *  - toggle: function to flip the theme
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';

    const fromCookie = getThemeCookie();
    if (fromCookie) return fromCookie;

    const saved = localStorage.getItem('plot-theme');
    if (saved === 'dark' || saved === 'light') return saved;

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  // Sync the .dark class on <html> and persist to cookie + localStorage whenever theme changes
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    setThemeCookie(theme);
    localStorage.setItem('plot-theme', theme);
  }, [theme]);

  // Listen for OS-level preference changes (only if user hasn't manually set)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e) => {
      const userOverride = getThemeCookie() || localStorage.getItem('plot-theme');
      if (!userOverride) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    toggle,
  };
}
