'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, useRef, useState } from 'react';
import { useCookieConsentOptional } from './cookie-consent-context';

/** Calm Design Rule 8: Analytics only after explicit user opt-in (cookie consent). */

const key =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_POSTHOG_KEY : '';
const host =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_POSTHOG_HOST
    : undefined;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const consent = useCookieConsentOptional();
  const initDoneRef = useRef(false);
  const [initialised, setInitialised] = useState(false);

  const analyticsAccepted = consent?.consent?.analytics ?? false;

  useEffect(() => {
    if (!key || typeof window === 'undefined') return;
    if (analyticsAccepted) {
      posthog.opt_in_capturing();
      if (!initDoneRef.current) {
        initDoneRef.current = true;
        posthog.init(key, {
          api_host: host || 'https://eu.posthog.com',
          person_profiles: 'identified_only',
        });
        queueMicrotask(() => setInitialised(true));
      }
    } else {
      posthog.opt_out_capturing();
    }
  }, [analyticsAccepted]);

  if (key && typeof window !== 'undefined' && analyticsAccepted && initialised) {
    return <PHProvider client={posthog}>{children}</PHProvider>;
  }

  return <>{children}</>;
}
