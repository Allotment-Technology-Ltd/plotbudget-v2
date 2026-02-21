'use client';

import { PwaInstallSection } from '@/components/pwa-install-section';

export interface GetTheAppTabProps {
  household: {
    is_couple: boolean;
    partner_invite_status?: 'none' | 'pending' | 'accepted';
  };
  isPartner?: boolean;
}

export function GetTheAppTab(_props: GetTheAppTabProps) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Get the app</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Add PLOT to your home screen or install it on your computer for quick access.
        </p>
        <PwaInstallSection />
      </section>
    </div>
  );
}
