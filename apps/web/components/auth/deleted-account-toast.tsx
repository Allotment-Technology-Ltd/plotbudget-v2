'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Shows a one-time toast when user lands on login with ?deleted=true (e.g. after account deletion).
 * Cleans the URL to /login so the query param is not visible or re-triggered.
 */
export function DeletedAccountToast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    if (searchParams.get('deleted') === 'true') {
      shown.current = true;
      toast.info('Your account has been deleted', {
        description: 'All your data has been permanently removed.',
      });
      router.replace('/login');
    }
  }, [searchParams, router]);

  return null;
}
