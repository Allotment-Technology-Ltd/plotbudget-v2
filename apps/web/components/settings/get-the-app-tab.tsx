'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { Button } from '@/components/ui/button';
import { createPartnerInviteLink, getPartnerInviteLink } from '@/app/actions/partner-invite';

export interface GetTheAppTabProps {
  household: {
    is_couple: boolean;
    partner_invite_status?: 'none' | 'pending' | 'accepted';
  };
  isPartner?: boolean;
}

export function GetTheAppTab({ household, isPartner = false }: GetTheAppTabProps) {
  const router = useRouter();
  const [linkLoading, setLinkLoading] = useState(false);

  const showPartnerInvite =
    household.is_couple && !isPartner && household.partner_invite_status !== 'accepted';

  async function handleCopyInviteLink() {
    setLinkLoading(true);
    try {
      const res = await getPartnerInviteLink();
      const link = res.url ?? (await createPartnerInviteLink()).url;
      await navigator.clipboard.writeText(link);
      toast.success('Invite link copied. Share it with your partner via WhatsApp, SMS, or any app.');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create invite link');
    } finally {
      setLinkLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Get the app</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Add PLOT to your home screen or install it on your computer for quick access.
        </p>
        <PwaInstallPrompt />
      </section>

      {showPartnerInvite && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Invite your partner</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Send your partner a link so they can join your household and budget together.
          </p>
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <Button
              variant="outline"
              disabled={linkLoading}
              onClick={handleCopyInviteLink}
            >
              {linkLoading ? 'Preparing...' : 'Copy invite link'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Or{' '}
              <Link
                href="/dashboard/settings?tab=household"
                className="underline text-foreground hover:no-underline"
              >
                go to Household
              </Link>{' '}
              to send an email invitation or manage your partner.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
