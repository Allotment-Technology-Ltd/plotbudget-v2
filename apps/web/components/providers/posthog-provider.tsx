'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';

const key = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_POSTHOG_KEY : '';
const host = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_POSTHOG_HOST : undefined;

if (key && typeof window !== 'undefined') {
  posthog.init(key, {
    api_host: host || 'https://eu.posthog.com',
    person_profiles: 'identified_only',
  });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!key) {
    return <>{children}</>;
  }
  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  );
}
