/**
 * Persists navigation state across app restarts.
 * Stores the current path in AsyncStorage and restores on launch.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

const PERSISTENCE_KEY = '@plot/navigation-state';

export async function getPersistedPath(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PERSISTENCE_KEY);
  } catch {
    return null;
  }
}

export async function setPersistedPath(path: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PERSISTENCE_KEY, path);
  } catch {
    // ignore
  }
}

/**
 * Hook to persist current path and restore on mount.
 * Call from root layout to enable persistence.
 */
export function useNavigationPersistence() {
  const pathname = usePathname();
  const router = useRouter();
  const isRestoring = useRef(false);
  const hasRestored = useRef(false);

  // Persist path on change
  useEffect(() => {
    if (isRestoring.current || !pathname) return;
    setPersistedPath(pathname);
  }, [pathname]);

  // Restore on mount (once)
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    getPersistedPath().then((savedPath) => {
      if (!savedPath || savedPath === pathname) return;
      // Only restore if we're at root and saved path is different
      const isAtRoot =
        pathname === '/' ||
        pathname === '/(tabs)' ||
        pathname === '/(tabs)/' ||
        pathname.startsWith('/(tabs)');
      if (isAtRoot && savedPath && savedPath !== pathname) {
        isRestoring.current = true;
        router.replace(savedPath as import('expo-router').Href);
        requestAnimationFrame(() => {
          isRestoring.current = false;
        });
      }
    });
  }, [pathname, router]);
}
