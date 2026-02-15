'use client';

import { useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';

/**
 * Fires pricing_page_viewed once when the pricing page mounts.
 * Mount only on the pricing page.
 */
export function PricingPageViewTrack() {
  const posthog = usePostHog();
  const sent = useRef(false);

  useEffect(() => {
    if (!posthog || sent.current) return;
    sent.current = true;
    posthog.capture('pricing_page_viewed', {
      source: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    });
  }, [posthog]);

  return null;
}
