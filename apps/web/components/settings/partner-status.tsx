'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  resendPartnerInvite,
  removePartner,
  getPartnerInviteLink,
  sendPartnerInviteToEmail,
  removePartnerAndDeleteAccount,
} from '@/app/actions/partner-invite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PartnerStatusProps {
  status: 'pending' | 'accepted';
  /** When pending, email may be null for link-only invites */
  email: string | null;
  sentAt?: string | null;
  acceptedAt?: string | null;
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

  const [linkOnlyEmail, setLinkOnlyEmail] = useState('');
  const [linkOnlySending, setLinkOnlySending] = useState(false);
  const [linkOnlyError, setLinkOnlyError] = useState('');

  async function handleResend() {
    setLoading(true);
    try {
      await resendPartnerInvite();
      toast.success('Invitation resent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    if (
      !confirm('Remove partner from this household? They can be re-invited and sign in to rejoin.')
    ) {
      return;
    }
    setLoading(true);
    try {
      await removePartner();
      toast.success('Partner removed from household');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveAndDeleteAccount() {
    if (
      !confirm(
        'Permanently remove partner and delete their account and data? This cannot be undone.'
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      await removePartnerAndDeleteAccount();
      toast.success('Partner removed and account deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove');
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
    const linkOnly = !email;
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 p-4">
        <p className="text-sm font-medium">Invitation Pending</p>
        {linkOnly ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Share the link below with your partner (e.g. WhatsApp, SMS, or in person).
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Sent to <strong>{email}</strong>
              {sentAt
                ? ` on ${new Date(sentAt).toLocaleDateString()}`
                : ''}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              You can also copy the invite link and share it (e.g. WhatsApp, SMS).
            </p>
          </>
        )}
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
          {linkOnly ? (
            <>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!linkOnlyEmail.trim()) return;
                setLinkOnlySending(true);
                setLinkOnlyError('');
                try {
                  await sendPartnerInviteToEmail(linkOnlyEmail.trim());
                  toast.success('Invitation email sent');
                  setLinkOnlyEmail('');
                } catch (err) {
                  setLinkOnlyError(err instanceof Error ? err.message : 'Something went wrong');
                } finally {
                  setLinkOnlySending(false);
                }
              }} className="inline-flex flex-wrap items-end gap-2"
              >
                <div className="flex flex-col gap-1">
                  <Label htmlFor="link-only-email" className="text-xs text-muted-foreground">
                    Or send invitation email to
                  </Label>
                  <Input
                    id="link-only-email"
                    type="email"
                    value={linkOnlyEmail}
                    onChange={(e) => setLinkOnlyEmail(e.target.value)}
                    placeholder="partner@example.com"
                    disabled={linkOnlySending}
                    className="h-8 w-48 text-sm"
                  />
                </div>
                <Button type="submit" variant="outline" className="text-sm" disabled={linkOnlySending || !linkOnlyEmail.trim()}>
                  {linkOnlySending ? 'Sending...' : 'Send email'}
                </Button>
              </form>
              {linkOnlyError && (
                <p className="w-full text-sm text-destructive" role="alert">
                  {linkOnlyError}
                </p>
              )}
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleResend}
              className="text-sm"
            >
              Resend email
            </Button>
          )}
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
        {email ?? 'Partner'} accepted
        {acceptedAt
          ? ` on ${new Date(acceptedAt).toLocaleDateString()}`
          : ''}
      </p>
      {lastLoginAt && (
        <p className="text-xs text-muted-foreground mt-1">
          Last login: {new Date(lastLoginAt).toLocaleDateString()}
        </p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Remove from household only (they can be re-invited), or remove and delete their account.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={handleRemove}
          className="text-sm"
        >
          Remove from household
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={handleRemoveAndDeleteAccount}
          className="text-sm border-destructive text-destructive hover:bg-destructive/10"
        >
          Remove and delete account
        </Button>
      </div>
    </div>
  );
}
