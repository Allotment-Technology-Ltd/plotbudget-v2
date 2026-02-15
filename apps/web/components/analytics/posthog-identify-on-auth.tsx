'use client';

import { useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import { createClient } from '@/lib/supabase/client';

/**
 * Calls posthog.identify(userId) when the user session is available.
 * Mount inside PostHogProvider so it runs on every page after login/signup.
 */
export function PostHogIdentifyOnAuth() {
  const posthog = usePostHog();
  const identified = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!posthog) return;

    const supabase = createClient();

    const setUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || identified.current.has(user.id)) return;
      posthog.identify(user.id);
      identified.current.add(user.id);
    };

    setUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [posthog]);

  return null;
}
