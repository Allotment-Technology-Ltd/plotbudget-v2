'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  resendPartnerInvite,
  removePartner,
  getPartnerInviteLink,
} from '@/app/actions/partner-invite';
import { Button } from '@/components/ui/button';

interface PartnerStatusProps {
  status: 'pending' | 'accepted';
  email: string;
  sentAt?: string;
  acceptedAt?: string;
  lastLoginAt?: string | null;
}

export function PartnerStatus({
  status,
  email,
  sentAt,
  acceptedAt,
  lastLoginAt,
}: PartnerStatusProps) {
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    try {
      await resendPartnerInvite();
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    if (
      !confirm('Are you sure you want to remove your partner\'s access?')
    ) {
      return;
    }
    setLoading(true);
    try {
      await removePartner();
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    const { url } = await getPartnerInviteLink();
    if (!url) {
      toast.error('No invite link available');
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Invite link copied. Share it via WhatsApp, SMS, or any app.');
    } catch {
      toast.error('Failed to copy link');
    }
  }

  if (status === 'pending') {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 p-4">
        <p className="text-sm font-medium">Invitation Pending</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Sent to <strong>{email}</strong>
          {sentAt
            ? ` on ${new Date(sentAt).toLocaleDateString()}`
            : ''}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          You can also copy the invite link and share it (e.g. WhatsApp, SMS).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleCopyLink}
            className="text-sm"
          >
            Copy invite link
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleResend}
            className="text-sm"
          >
            Resend email
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleRemove}
            className="text-sm border-destructive text-destructive hover:bg-destructive/10"
          >
            Cancel Invitation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 p-4">
      <p className="text-sm font-medium">Partner Active</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {email} accepted
        {acceptedAt
          ? ` on ${new Date(acceptedAt).toLocaleDateString()}`
          : ''}
      </p>
      {lastLoginAt && (
        <p className="text-xs text-muted-foreground mt-1">
          Last login: {new Date(lastLoginAt).toLocaleDateString()}
        </p>
      )}
      <div className="mt-4">
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={handleRemove}
          className="text-sm border-destructive text-destructive hover:bg-destructive/10"
        >
          Remove Partner
        </Button>
      </div>
    </div>
  );
}
