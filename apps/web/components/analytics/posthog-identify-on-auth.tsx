'use client';

import { useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import { createClient } from '@/lib/supabase/client';
import { useCookieConsentOptional } from '@/components/providers/cookie-consent-context';

/**
 * Calls posthog.identify(userId) when the user session is available.
 * Only runs when user has explicitly accepted analytics (Calm Design Rule 8).
 */
export function PostHogIdentifyOnAuth() {
  const posthog = usePostHog();
  const consent = useCookieConsentOptional();
  const identified = useRef<Set<string>>(new Set());

  const analyticsAccepted = consent?.consent?.analytics === true;

  useEffect(() => {
    if (!posthog || !analyticsAccepted) return;

    const supabase = createClient();

    const setUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || identified.current.has(user.id)) return;
      posthog.identify(user.id);
      identified.current.add(user.id);
    };

    setUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        identified.current.clear();
        return;
      }
      setUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [posthog, analyticsAccepted]);

  return null;
}
