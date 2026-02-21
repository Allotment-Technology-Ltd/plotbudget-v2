'use client';

import { useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';
import { useCookieConsentOptional } from '@/components/providers/cookie-consent-context';

/**
 * Fires pricing_page_viewed once when the pricing page mounts.
 * Only runs when user has accepted analytics (Calm Design Rule 8).
 */
export function PricingPageViewTrack() {
  const posthog = usePostHog();
  const consent = useCookieConsentOptional();
  const sent = useRef(false);

  useEffect(() => {
    if (!posthog || !consent?.consent?.analytics || sent.current) return;
    sent.current = true;
    posthog.capture('pricing_page_viewed', {
      source: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    });
  }, [posthog, consent?.consent?.analytics]);

  return null;
}
