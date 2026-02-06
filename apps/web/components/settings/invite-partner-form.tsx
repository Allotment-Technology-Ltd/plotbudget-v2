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
      toast.success('Invitation sent!');
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
      toast.success('Invite link created and copied. Share it via WhatsApp, SMS, or any app.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLinkLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="partner-email">Partner Email</Label>
          <Input
            id="partner-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="partner@example.com"
            required
            className="mt-2"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send invitation email'}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">Or create a shareable link to send yourself (e.g. WhatsApp, SMS):</p>
      <Button
        type="button"
        variant="outline"
        disabled={linkLoading}
        onClick={handleCreateLink}
      >
        {linkLoading ? 'Creating...' : 'Create invite link'}
      </Button>
    </div>
  );
}
