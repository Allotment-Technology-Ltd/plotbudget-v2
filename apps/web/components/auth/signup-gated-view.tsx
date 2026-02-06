'use client';

import Link from 'next/link';

interface SignupGatedViewProps {
  waitlistUrl: string;
}

/**
 * Shown on /signup when signup is gated (beta). Links to MailerLite waitlist or marketing page.
 */
export function SignupGatedView({ waitlistUrl }: SignupGatedViewProps) {
  return (
    <div className="space-y-6" data-testid="signup-gated-view">
      <div className="space-y-2 text-center">
        <h2 className="font-heading text-headline-sm md:text-headline uppercase tracking-wider">
          Join the waitlist
        </h2>
        <p className="text-muted-foreground font-body">
          PLOT is in private beta. Register below to be first in line when we launch.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <a
          href={waitlistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex items-center justify-center rounded-md px-6 py-3 w-full font-heading text-cta uppercase tracking-widest"
          data-testid="waitlist-cta"
        >
          Register for the waitlist
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
