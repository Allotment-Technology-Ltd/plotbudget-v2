import { useState, useEffect, useCallback } from 'react';

/**
 * useTheme — Manages PLOT's light/dark theme from system preference only.
 * No persistence (no cookie or localStorage) to avoid routing/refresh issues.
 * Toggle works for the current session; on refresh we fall back to system preference.
 *
 * Returns:
 *  - theme:  'light' | 'dark'
 *  - isDark: boolean shorthand
 *  - toggle: function to flip the theme
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setTheme(e.matches ? 'dark' : 'light');
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
