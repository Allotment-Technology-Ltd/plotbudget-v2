import { useState, useEffect, useCallback } from 'react';

/**
 * useTheme — Custom hook for managing PLOT's dual-mode theme.
 *
 * Behaviour:
 *  1. On first load, checks localStorage for a saved preference.
 *  2. Falls back to the user's OS preference (prefers-color-scheme).
 *  3. Defaults to 'light' if neither is available.
 *  4. Persists the user's choice to localStorage on every toggle.
 *  5. Listens for OS-level theme changes and follows them
 *     ONLY if the user hasn't manually overridden.
 *  6. Adds/removes the .dark class on <html> (used by Tailwind + CSS vars).
 *
 * Returns:
 *  - theme:  'light' | 'dark'
 *  - isDark: boolean shorthand
 *  - toggle: function to flip the theme
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';

    const saved = localStorage.getItem('plot-theme');
    if (saved === 'dark' || saved === 'light') return saved;

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  // Sync the .dark class on <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('plot-theme', theme);
  }, [theme]);

  // Listen for OS-level preference changes (only if user hasn't manually set)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e) => {
      const userOverride = localStorage.getItem('plot-theme');
      // Only follow system if user hasn't explicitly chosen
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
