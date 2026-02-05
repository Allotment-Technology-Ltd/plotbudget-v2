'use client';

import { Key, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePassword } from '@/lib/actions/account-actions';

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const isValid = newPassword.length >= 12 && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);
    try {
      await changePassword(newPassword);
      toast.success('Password updated successfully');
      setOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && !isLoading) {
      setNewPassword('');
      setConfirmPassword('');
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary">
          <Key className="mr-2 h-4 w-4" aria-hidden />
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-lg border-border">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Update your account password. You&apos;ll remain logged in.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              disabled={isLoading}
              minLength={12}
              autoComplete="new-password"
              aria-invalid={newPassword.length > 0 && newPassword.length < 12}
              aria-describedby="newPassword-help newPassword-error"
            />
            {newPassword.length > 0 && newPassword.length < 12 && (
              <p
                id="newPassword-error"
                className="text-sm text-destructive"
                role="alert"
              >
                Password must be at least 12 characters
              </p>
            )}
            <p id="newPassword-help" className="text-sm text-muted-foreground">
              Use 3 random words for a strong, memorable password
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={isLoading}
              autoComplete="new-password"
              aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
              aria-describedby="confirmPassword-error"
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p
                id="confirmPassword-error"
                className="text-sm text-destructive"
                role="alert"
              >
                Passwords do not match
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              )}
              Update Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
