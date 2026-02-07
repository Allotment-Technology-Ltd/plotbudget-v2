'use client';

import { AlertTriangle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteUserAccount } from '@/lib/actions/account-actions';

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValid = confirmText === 'DELETE';

  const handleDelete = async () => {
    if (!isValid) return;

    setIsLoading(true);
    try {
      await deleteUserAccount();
      // Redirect happens in server action
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete account'
      );
      setIsLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setConfirmText('');
    setOpen(next);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" aria-hidden />
          Delete My Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        className="rounded-lg border-border"
        role="alertdialog"
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
      >
        <AlertDialogHeader>
          <AlertDialogTitle id="delete-account-title">
            Delete Account
          </AlertDialogTitle>
          <AlertDialogDescription id="delete-account-description">
            This action cannot be undone. All your data will be permanently
            deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          <AlertDescription>
            The following will be permanently deleted:
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Household settings</li>
              <li>Budget blueprints</li>
              <li>Paycycle history</li>
              <li>Seeds, pots, and repayments</li>
            </ul>
          </AlertDescription>
        </Alert>
        <div className="space-y-2">
          <Label htmlFor="confirmDelete">
            Type <span className="font-display font-semibold">DELETE</span> to
            confirm
          </Label>
          <div className="relative">
            <Input
              id="confirmDelete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              disabled={isLoading}
              className={isValid ? 'pr-10 border-destructive/50' : ''}
              autoComplete="off"
              aria-invalid={confirmText.length > 0 && !isValid}
            />
            {isValid && (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
                aria-hidden
              >
                <CheckCircle2 className="h-5 w-5" />
              </span>
            )}
          </div>
        </div>
        <AlertDialogFooter className="gap-2 pt-4">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={!isValid || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            )}
            Confirm Deletion
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
