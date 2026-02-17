import Link from 'next/link';
import { marketingUrl } from '@/lib/marketing-url';

/**
 * Shown on signup hub and signup/email. Link opens marketing site terms in same tab.
 */
export function SignupTerms() {
  return (
    <p className="text-center text-xs text-muted-foreground" data-testid="signup-terms">
      By signing up, you agree to our{' '}
      <Link
        href={marketingUrl('/terms')}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        Terms of Service
      </Link>
    </p>
  );
}
