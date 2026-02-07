import { Suspense } from 'react';
import { PartnerCompleteClient } from './partner-complete-client';

function PartnerCompleteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" data-testid="partner-complete-loading">
      <div className="text-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

export default function PartnerCompletePage() {
  return (
    <Suspense fallback={<PartnerCompleteFallback />}>
      <PartnerCompleteClient />
    </Suspense>
  );
}
