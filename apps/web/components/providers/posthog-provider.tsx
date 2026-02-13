'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useRef } from 'react';
import { useCookieConsentOptional } from './cookie-consent-context';

const key =
  typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_POSTHOG_KEY : '';
const host =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_POSTHOG_HOST
    : undefined;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const consent = useCookieConsentOptional();
  const initialised = useRef(false);

  const analyticsAccepted = consent?.consent?.analytics ?? false;

  if (key && typeof window !== 'undefined' && analyticsAccepted) {
    if (!initialised.current) {
      initialised.current = true;
      posthog.init(key, {
        api_host: host || 'https://eu.posthog.com',
        person_profiles: 'identified_only',
      });
    }
    return <PHProvider client={posthog}>{children}</PHProvider>;
  }

  return <>{children}</>;
}
