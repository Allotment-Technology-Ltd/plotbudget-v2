'use client';

import { useState } from 'react';
import { resendPartnerInvite, removePartner } from '@/app/actions/partner-invite';
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
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleResend}
            className="text-sm"
          >
            Resend Invitation
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
