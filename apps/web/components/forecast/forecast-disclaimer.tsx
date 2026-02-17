'use client';

import { Info } from 'lucide-react';

interface ForecastDisclaimerProps {
  /** Show extra interest disclaimer when projections include interest */
  includeInterest?: boolean;
  className?: string;
}

export function ForecastDisclaimer({
  includeInterest = false,
  className = '',
}: ForecastDisclaimerProps) {
  return (
    <div className={`text-xs text-muted-foreground ${className}`}>
      <p className="flex items-start gap-2" role="status">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden />
        <span>
          Projections are for planning purposes only. PLOT does not provide
          financial advice.
          {includeInterest && (
            <>
              {' '}
              Interest projections are illustrative and assume rates stay
              constant. Actual costs may differ. PLOT is not FCA-regulated.
            </>
          )}
        </span>
      </p>
      <details className="mt-2">
        <summary className="cursor-pointer hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded list-none [&::-webkit-details-marker]:hidden">
          Legal
        </summary>
        <p className="mt-2 pl-4 text-muted-foreground">
          PLOT Budget is a budgeting and planning tool. We do not offer
          regulated financial advice. You are responsible for your own
          financial decisions. For debt or savings advice, consider speaking
          to an FCA-authorised adviser or debt charity.
        </p>
      </details>
    </div>
  );
}
