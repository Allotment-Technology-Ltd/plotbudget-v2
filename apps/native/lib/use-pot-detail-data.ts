import { useCallback, useEffect, useState } from 'react';
import type { Pot } from '@repo/supabase';
import type { CurrencyCode } from '@repo/logic';
import { fetchDashboardData } from '@/lib/dashboard-data';

export function usePotDetailData(potId: string | undefined) {
  const [pot, setPot] = useState<Pot | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('GBP');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!potId) return;
    setLoading(true);
    try {
      const result = await fetchDashboardData();
      const found = result.pots.find((p) => p.id === potId);
      setPot(found ?? null);
      setCurrency((result.household?.currency ?? 'GBP') as CurrencyCode);
    } finally {
      setLoading(false);
    }
  }, [potId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { pot, currency, loading, reload: loadData, setPot };
}
