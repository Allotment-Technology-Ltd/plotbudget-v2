'use client';

import Link from 'next/link';
import { REGION_RESTRICTED_MESSAGE } from '@/lib/auth/allowed-countries';
import { getWaitlistUrlFromEnv } from '@/lib/feature-flags';

/**
 * Shown on /signup when the user's region is not allowed (UK, EU, USA, Canada only).
 */
export function RegionRestrictedView() {
  const waitlistUrl = getWaitlistUrlFromEnv();

  return (
    <div className="space-y-6" data-testid="region-restricted-view">
      <div className="space-y-2 text-center">
        <h2 className="font-heading text-headline-sm md:text-headline uppercase tracking-wider">
          Not available in your region yet
        </h2>
        <p className="text-muted-foreground font-body">
          {REGION_RESTRICTED_MESSAGE}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <a
          href={waitlistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex items-center justify-center rounded-md px-6 py-3 w-full font-heading text-cta uppercase tracking-widest"
          data-testid="region-waitlist-cta"
        >
          Join the waitlist
        </a>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium" data-testid="nav-login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
