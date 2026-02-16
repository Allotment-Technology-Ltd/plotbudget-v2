import { useMemo } from 'react';
import type { Seed } from '@repo/supabase';
import type { Payer } from '@/lib/mark-seed-paid';

export function useSeedCardCapabilities(
  seed: Seed & { is_paid_me?: boolean; is_paid_partner?: boolean },
  isRitualMode: boolean,
  isCycleLocked: boolean,
  onMarkPaid?: (payer: Payer) => void,
  onUnmarkPaid?: (payer: Payer) => void
) {
  return useMemo(() => {
    const isPaid = !!seed.is_paid;
    const isPaidMe = !!seed.is_paid_me;
    const isPaidPartner = !!seed.is_paid_partner;
    const canMarkUnmark = !isCycleLocked && isRitualMode && !!(onMarkPaid || onUnmarkPaid);
    const canEditOrDelete = !isCycleLocked && (!isRitualMode || !isPaid);

    return { isPaid, isPaidMe, isPaidPartner, canMarkUnmark, canEditOrDelete };
  }, [seed.is_paid, seed.is_paid_me, seed.is_paid_partner, isRitualMode, isCycleLocked, onMarkPaid, onUnmarkPaid]);
}
