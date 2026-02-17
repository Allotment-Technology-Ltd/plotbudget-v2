'use client';

import Link from 'next/link';
import { marketingUrl } from '@/lib/marketing-url';
import { useCookieConsentOptional } from '@/components/providers/cookie-consent-context';
import { useNavigationProgress } from '@/components/navigation/navigation-progress-context';

export function AppFooter() {
  const cookieConsent = useCookieConsentOptional();
  const { setNavigating } = useNavigationProgress();

  return (
    <footer
      className="border-t border-border py-4"
      role="contentinfo"
      aria-label="App footer"
    >
      <div className="content-wrapper flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <a
          href="mailto:hello@plotbudget.com"
          className="font-heading uppercase tracking-wider hover:text-foreground transition-colors"
        >
          Help
        </a>
        <Link
          href="/dashboard/feedback"
          className="font-heading uppercase tracking-wider hover:text-foreground transition-colors"
          onClick={() => setNavigating(true)}
        >
          Feedback & bugs
        </Link>
        <a
          href={marketingUrl('/changelog')}
          target="_blank"
          rel="noopener noreferrer"
          className="font-heading uppercase tracking-wider hover:text-foreground transition-colors"
        >
          What&apos;s new
        </a>
        <a
          href={marketingUrl('/privacy')}
          target="_blank"
          rel="noopener noreferrer"
          className="font-heading uppercase tracking-wider hover:text-foreground transition-colors"
        >
          Privacy
        </a>
        {cookieConsent && (
          <button
            type="button"
            onClick={() => cookieConsent.openSettings()}
            className="font-heading uppercase tracking-wider hover:text-foreground transition-colors"
          >
            Cookie settings
          </button>
        )}
        <a
          href={marketingUrl('/terms')}
          target="_blank"
          rel="noopener noreferrer"
          className="font-heading uppercase tracking-wider hover:text-foreground transition-colors"
        >
          Terms
        </a>
      </div>
    </footer>
  );
}
