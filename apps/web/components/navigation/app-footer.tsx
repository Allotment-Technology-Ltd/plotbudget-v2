'use client';

import { marketingUrl } from '@/lib/marketing-url';

export function AppFooter() {
  return (
    <footer
      className="border-t border-border py-4"
      role="contentinfo"
      aria-label="App footer"
    >
      <div className="content-wrapper flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <a
          href={marketingUrl('/')}
          target="_blank"
          rel="noopener noreferrer"
          className="font-heading uppercase tracking-wider hover:text-foreground transition-colors"
        >
          Help
        </a>
        <a
          href={marketingUrl('/privacy')}
          target="_blank"
          rel="noopener noreferrer"
          className="font-heading uppercase tracking-wider hover:text-foreground transition-colors"
        >
          Privacy
        </a>
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
