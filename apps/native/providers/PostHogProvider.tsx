/**
 * PostHog React Native provider. Uses same project key and host as web.
 * Identify is done in PostHogIdentifyOnAuth when session is available.
 */

import { PostHogProvider as PHProvider } from 'posthog-react-native';
import type { ReactNode } from 'react';

const key = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.posthog.com';

export function PostHogProvider({ children }: { children: ReactNode }) {
  if (!key) {
    return <>{children}</>;
  }
  return (
    <PHProvider
      apiKey={key}
      options={{ host }}>
      {children as never}
    </PHProvider>
  );
}
