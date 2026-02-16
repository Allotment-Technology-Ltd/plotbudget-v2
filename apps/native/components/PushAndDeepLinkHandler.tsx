/**
 * When the user is signed in: register push token with the backend and handle
 * notification taps (deep link from push). Also handles initial URL (app opened via link).
 */

import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePushPreferences } from '@/contexts/PushPreferencesContext';
import { registerPushToken } from '@/lib/register-push-token';

/** Extract path from URL like native:///(tabs)/two or native://blueprint */
function pathFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = Linking.parse(url);
    const path = parsed.path ?? parsed.hostname;
    if (typeof path === 'string' && path.startsWith('/')) return path;
    if (typeof path === 'string') return `/${path}`;
    return null;
  } catch {
    return null;
  }
}

export function PushAndDeepLinkHandler() {
  const { session } = useAuth();
  const { pushEnabled, preferences } = usePushPreferences();
  const router = useRouter();
  const registeredRef = useRef(false);

  // Register push token when session is available and user has at least one push type enabled
  useEffect(() => {
    if (!session?.user?.id || !pushEnabled) {
      registeredRef.current = false;
      return;
    }
    if (registeredRef.current) return;
    registeredRef.current = true;
    registerPushToken(preferences).then(({ ok }) => {
      if (!ok) registeredRef.current = false;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- register once when pushEnabled turns on; prefs sync via PATCH from Settings
  }, [session?.user?.id, pushEnabled]);

  // Handle notification tap -> navigate to data.path
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { path?: string; url?: string } | undefined;
      const path = typeof data?.path === 'string' ? data.path : pathFromUrl(data?.url ?? null);
      if (path) {
        router.push(path as import('expo-router').Href);
      }
    });
    return () => sub.remove();
  }, [router]);

  // Handle initial URL (app opened via link)
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      const path = pathFromUrl(url);
      if (path) {
        router.replace(path as import('expo-router').Href);
      }
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      const path = pathFromUrl(url);
      if (path) {
        router.push(path as import('expo-router').Href);
      }
    });
    return () => sub.remove();
  }, [router]);

  return null;
}
