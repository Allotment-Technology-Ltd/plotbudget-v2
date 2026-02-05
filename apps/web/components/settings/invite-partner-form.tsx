'use client';

import { useState } from 'react';
import { invitePartner } from '@/app/actions/partner-invite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function InvitePartnerForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await invitePartner(email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
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
        {loading ? 'Sending...' : 'Send Invitation'}
      </Button>
    </form>
  );
}
