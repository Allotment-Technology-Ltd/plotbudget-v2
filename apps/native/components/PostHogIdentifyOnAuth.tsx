/**
 * Calls posthog.identify(userId) when the user session is available.
 * Mirrors web apps/web/components/analytics/posthog-identify-on-auth.tsx
 */

import { usePostHog } from 'posthog-react-native';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function PostHogIdentifyOnAuth() {
  const posthog = usePostHog();
  const { session } = useAuth();
  const identifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!posthog) return;
    const userId = session?.user?.id ?? null;
    if (userId && identifiedRef.current !== userId) {
      identifiedRef.current = userId;
      posthog.identify(userId);
    }
    if (!userId) {
      identifiedRef.current = null;
    }
  }, [posthog, session?.user?.id]);

  return null;
}
