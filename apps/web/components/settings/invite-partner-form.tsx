'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { invitePartner, createPartnerInviteLink } from '@/app/actions/partner-invite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function InvitePartnerForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await invitePartner(email);
      toast.success('Invitation sent');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateLink() {
    setLinkLoading(true);
    setError('');
    try {
      const { url } = await createPartnerInviteLink();
      await navigator.clipboard.writeText(url);
      toast.success('Link copied. Share it with your partner.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLinkLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Send an invite so your partner can join this household and budget with you.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="partner-email">Partner&apos;s email</Label>
          <Input
            id="partner-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="partner@example.com"
            required
            disabled={loading}
            aria-invalid={!!error}
            aria-describedby={error ? 'partner-invite-error' : undefined}
          />
        </div>
        {error && (
          <p id="partner-invite-error" className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} aria-busy={loading}>
          {loading ? 'Sending…' : 'Send invitation email'}
        </Button>
      </form>

      <div className="relative">
        <span className="absolute inset-0 flex items-center" aria-hidden>
          <span className="w-full border-t border-border" />
        </span>
        <span className="relative flex justify-center text-xs uppercase tracking-wider text-muted-foreground">
          Or
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Copy a link and share it yourself (e.g. WhatsApp, SMS).
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={linkLoading}
          onClick={handleCreateLink}
        >
          {linkLoading ? 'Preparing…' : 'Copy invite link'}
        </Button>
      </div>
    </div>
  );
}
