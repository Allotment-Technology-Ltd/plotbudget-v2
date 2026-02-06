'use client';

import { Loader2, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChangePasswordDialog } from './change-password-dialog';
import { updateUserProfile } from '@/lib/actions/settings-actions';

interface ProfileTabProps {
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
  isPartner?: boolean;
}

export function ProfileTab({ user, isPartner = false }: ProfileTabProps) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateUserProfile(displayName.trim());
      toast.success('Profile updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const initials = displayName
    ? displayName.charAt(0).toUpperCase()
    : user.email.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <section className="bg-card rounded-lg border border-border p-6">
        <h2 className="font-heading text-headline-sm md:text-headline uppercase tracking-wider text-foreground mb-4">
          Who is signed in
        </h2>
        <div className="mb-6 rounded-md border border-border bg-muted/30 px-4 py-3">
          <p className="text-sm font-medium text-foreground">
            {isPartner ? (
              <>Viewing as partner: <span className="normal-case font-normal text-muted-foreground">{user.email}</span></>
            ) : (
              <>Logged in as: <span className="normal-case font-normal text-muted-foreground">{user.email}</span></>
            )}
          </p>
        </div>
        <h2 className="font-heading text-lg uppercase tracking-wider text-foreground mb-6">
          Profile Information
        </h2>
        {isPartner ? (
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              readOnly
              disabled
              className="bg-muted/50 cursor-not-allowed normal-case"
              aria-describedby="email-help"
            />
            <p id="email-help" className="text-sm text-muted-foreground">
              You are viewing this household as the invited partner. Use &quot;Leave&quot; in the menu to sign out.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                maxLength={50}
                disabled={isLoading}
                aria-describedby="displayName-help"
              />
              <p id="displayName-help" className="text-sm text-muted-foreground">
                This is how your name will appear in the app.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                readOnly
                disabled
                className="bg-muted/50 cursor-not-allowed normal-case"
                aria-describedby="email-help"
              />
              <p id="email-help" className="text-sm text-muted-foreground">
                Managed by your account authentication.
              </p>
            </div>
            <Button type="submit" disabled={isLoading} aria-busy={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              )}
              Save Changes
            </Button>
          </form>
        )}
      </section>

      {!isPartner && (
      <section className="bg-card rounded-lg border border-border p-6">
        <h2 className="font-heading text-lg uppercase tracking-wider text-foreground mb-6">
          Security
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Update your password to keep your account secure.
        </p>
        <ChangePasswordDialog />
      </section>
      )}

      {!isPartner && (
      <section className="bg-card rounded-lg border border-border p-6">
        <h2 className="font-heading text-lg uppercase tracking-wider text-foreground mb-6">
          Avatar
        </h2>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Avatar className="h-20 w-20 rounded-full border border-border">
            <AvatarFallback className="bg-primary/10 text-primary font-display text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2 flex-1">
            <p className="text-sm text-muted-foreground">
              Upload a profile picture (max 2MB, JPG/PNG)
            </p>
            <Button type="button" variant="secondary" disabled aria-disabled="true">
              <Upload className="mr-2 h-4 w-4" aria-hidden />
              Upload Avatar
            </Button>
            <p className="text-xs text-muted-foreground">
              Avatar upload coming soon
            </p>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}
