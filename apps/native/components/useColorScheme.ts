import { useThemePreference } from '@/contexts/ThemePreferenceContext';

/** Returns the resolved color scheme (user preference or system). Defaults to dark. */
export function useColorScheme() {
  const { resolvedScheme } = useThemePreference();
  return resolvedScheme;
}
