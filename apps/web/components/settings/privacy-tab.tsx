'use client';

import { AlertTriangle, Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DeleteAccountDialog } from './delete-account-dialog';
import { exportUserData } from '@/lib/actions/account-actions';

interface PrivacyTabProps {
  userId: string;
  isPartner?: boolean;
}

export function PrivacyTab({ userId: _userId, isPartner = false }: PrivacyTabProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvData = await exportUserData();
      const blob = new Blob([csvData], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const today = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `plotbudget_export_${today}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to export data'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {!isPartner && (
        <section className="bg-card rounded-lg border border-border p-6">
          <h2 className="font-heading text-lg uppercase tracking-wider text-foreground mb-6">
            Export Your Data
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Download all your budgeting data in CSV format. Includes seeds, pots,
            repayments, and paycycle history.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={handleExport}
            disabled={isExporting}
            aria-busy={isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Download className="mr-2 h-4 w-4" aria-hidden />
            )}
            Export My Data
          </Button>
        </section>
      )}

      <section className="bg-card rounded-lg border border-border p-6">
        <h2 className="font-heading text-lg uppercase tracking-wider text-foreground mb-6">
          {isPartner ? 'Delete My Account' : 'Danger Zone'}
        </h2>
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          <AlertDescription className="break-words min-w-0">
            {isPartner
              ? 'Permanently delete your account and data. You will be removed from the household. This cannot be undone.'
              : 'This action cannot be undone. All your data will be permanently deleted, including your household, paycycles, seeds, pots, and repayments.'}
          </AlertDescription>
        </Alert>
        <DeleteAccountDialog />
      </section>
    </div>
  );
}
