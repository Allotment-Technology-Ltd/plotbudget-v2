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
      toast.success('Link copied');
    } catch {
      toast.error('Failed to copy link');
    }
  }

  if (status === 'pending') {
    const linkOnly = !email;
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-4">
        <div>
          <p className="font-medium text-foreground">Invitation pending</p>
          {linkOnly ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Share the link with your partner (e.g. WhatsApp, SMS).
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Sent to {email}
              {sentAt ? ` on ${new Date(sentAt).toLocaleDateString()}` : ''}.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            disabled={loading}
            onClick={handleCopyLink}
          >
            Copy invite link
          </Button>
          {linkOnly ? (
            <>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!linkOnlyEmail.trim()) return;
                  setLinkOnlySending(true);
                  setLinkOnlyError('');
                  try {
                    await sendPartnerInviteToEmail(linkOnlyEmail.trim());
                    toast.success('Invitation email sent');
                    setLinkOnlyEmail('');
                  } catch (err) {
                    setLinkOnlyError(
                      err instanceof Error ? err.message : 'Something went wrong'
                    );
                  } finally {
                    setLinkOnlySending(false);
                  }
                }}
                className="inline-flex flex-wrap items-end gap-2"
              >
                <div className="flex flex-col gap-1">
                  <Label htmlFor="link-only-email" className="text-xs text-muted-foreground">
                    Send to email
                  </Label>
                  <Input
                    id="link-only-email"
                    type="email"
                    value={linkOnlyEmail}
                    onChange={(e) => setLinkOnlyEmail(e.target.value)}
                    placeholder="partner@example.com"
                    disabled={linkOnlySending}
                    className="h-9 w-52 text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={linkOnlySending || !linkOnlyEmail.trim()}
                >
                  {linkOnlySending ? 'Sending…' : 'Send email'}
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
              variant="secondary"
              disabled={loading}
              onClick={handleResend}
            >
              Resend email
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={handleRemove}
            className="text-muted-foreground hover:text-destructive"
          >
            Cancel invitation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-5 space-y-4">
      <div>
        <p className="font-medium text-foreground">Partner active</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {email ?? 'Partner'} joined
          {acceptedAt ? ` on ${new Date(acceptedAt).toLocaleDateString()}` : ''}.
        </p>
        {lastLoginAt && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Last login: {new Date(lastLoginAt).toLocaleDateString()}
          </p>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        You can remove them from the household (they can be re-invited), or remove and delete
        their account.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={handleRemove}
        >
          Remove from household
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={loading}
          onClick={handleRemoveAndDeleteAccount}
          className="text-muted-foreground hover:text-destructive"
        >
          Remove and delete account
        </Button>
      </div>
    </div>
  );
}
