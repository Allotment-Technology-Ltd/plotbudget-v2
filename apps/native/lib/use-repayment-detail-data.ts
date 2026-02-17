import { useCallback, useEffect, useState } from 'react';
import type { Repayment, Household, PayCycle, Seed } from '@repo/supabase';
import type { CurrencyCode } from '@repo/logic';
import { fetchDashboardData } from '@/lib/dashboard-data';

export function useRepaymentDetailData(repaymentId: string | undefined) {
  const [repayment, setRepayment] = useState<Repayment | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('GBP');
  const [loading, setLoading] = useState(true);
  const [household, setHousehold] = useState<Household | null>(null);
  const [paycycle, setPaycycle] = useState<PayCycle | null>(null);
  const [linkedSeed, setLinkedSeed] = useState<Seed | null>(null);

  const loadData = useCallback(async () => {
    if (!repaymentId) return;
    setLoading(true);
    try {
      const result = await fetchDashboardData();
      const found = result.repayments.find((r) => r.id === repaymentId);
      setRepayment(found ?? null);
      setCurrency((result.household?.currency ?? 'GBP') as CurrencyCode);
      setHousehold(result.household ?? null);
      setPaycycle(result.currentPaycycle ?? null);
      const seed =
        result.seeds.find(
          (s) => s.linked_repayment_id === repaymentId && s.is_recurring
        ) ?? null;
      setLinkedSeed(seed);
    } finally {
      setLoading(false);
    }
  }, [repaymentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    repayment,
    currency,
    loading,
    reload: loadData,
    setRepayment,
    household,
    paycycle,
    linkedSeed,
  };
}
