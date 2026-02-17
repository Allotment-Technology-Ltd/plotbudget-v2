import { useCallback, useEffect, useState } from 'react';
import type { Pot, Household, PayCycle, Seed } from '@repo/supabase';
import type { CurrencyCode } from '@repo/logic';
import { fetchDashboardData } from '@/lib/dashboard-data';

export function usePotDetailData(potId: string | undefined) {
  const [pot, setPot] = useState<Pot | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('GBP');
  const [loading, setLoading] = useState(true);
  const [household, setHousehold] = useState<Household | null>(null);
  const [paycycle, setPaycycle] = useState<PayCycle | null>(null);
  const [linkedSeed, setLinkedSeed] = useState<Seed | null>(null);

  const loadData = useCallback(async () => {
    if (!potId) return;
    setLoading(true);
    try {
      const result = await fetchDashboardData();
      const found = result.pots.find((p) => p.id === potId);
      setPot(found ?? null);
      setCurrency((result.household?.currency ?? 'GBP') as CurrencyCode);
      setHousehold(result.household ?? null);
      setPaycycle(result.currentPaycycle ?? null);
      const seed = result.seeds.find(
        (s) => s.linked_pot_id === potId && s.is_recurring
      ) ?? null;
      setLinkedSeed(seed);
    } finally {
      setLoading(false);
    }
  }, [potId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { pot, currency, loading, reload: loadData, setPot, household, paycycle, linkedSeed };
}
