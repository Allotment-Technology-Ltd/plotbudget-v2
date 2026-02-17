'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { markSeedPaid, unmarkSeedPaid } from '@/lib/actions/ritual-actions';
import type { Seed } from '@repo/supabase';
import type { Database } from '@repo/supabase';

type Household = Database['public']['Tables']['households']['Row'];
type Payer = 'me' | 'partner' | 'both';

export function useBlueprintOptimisticPaid(seeds: Seed[], household: Household) {
  const [optimisticPaidIds, setOptimisticPaidIds] = useState<Set<string>>(new Set());
  const [optimisticUnpaidIds, setOptimisticUnpaidIds] = useState<Set<string>>(new Set());
  const [optimisticPaidMeIds, setOptimisticPaidMeIds] = useState<Set<string>>(new Set());
  const [optimisticPaidPartnerIds, setOptimisticPaidPartnerIds] = useState<Set<string>>(new Set());
  const [optimisticUnpaidMeIds, setOptimisticUnpaidMeIds] = useState<Set<string>>(new Set());
  const [optimisticUnpaidPartnerIds, setOptimisticUnpaidPartnerIds] = useState<Set<string>>(new Set());

  const displaySeeds = useMemo(() => {
    return seeds.map((s) => {
      const isJoint = s.payment_source === 'joint' && household.is_couple;
      if (isJoint) {
        const isPaidMe =
          (s.is_paid_me || optimisticPaidMeIds.has(s.id)) &&
          !optimisticUnpaidMeIds.has(s.id);
        const isPaidPartner =
          (s.is_paid_partner || optimisticPaidPartnerIds.has(s.id)) &&
          !optimisticUnpaidPartnerIds.has(s.id);
        return {
          ...s,
          is_paid_me: isPaidMe,
          is_paid_partner: isPaidPartner,
          is_paid: isPaidMe && isPaidPartner,
        };
      }
      if (optimisticUnpaidIds.has(s.id)) {
        return { ...s, is_paid: false, is_paid_me: false, is_paid_partner: false };
      }
      if (optimisticPaidIds.has(s.id)) {
        return { ...s, is_paid: true, is_paid_me: true, is_paid_partner: s.is_paid_partner };
      }
      return s;
    });
  }, [
    seeds,
    optimisticPaidIds,
    optimisticUnpaidIds,
    optimisticPaidMeIds,
    optimisticPaidPartnerIds,
    optimisticUnpaidMeIds,
    optimisticUnpaidPartnerIds,
    household.is_couple,
  ]);

  useEffect(() => {
    setOptimisticPaidIds((prev) => {
      const next = new Set(prev);
      seeds.forEach((s) => {
        if (s.is_paid) next.delete(s.id);
      });
      return next.size === prev.size ? prev : next;
    });
    setOptimisticUnpaidIds((prev) => {
      const next = new Set(prev);
      seeds.forEach((s) => {
        if (!s.is_paid) next.delete(s.id);
      });
      return next.size === prev.size ? prev : next;
    });
    setOptimisticPaidMeIds((prev) => {
      const next = new Set(prev);
      seeds.forEach((s) => {
        if (s.payment_source === 'joint' && s.is_paid_me) next.delete(s.id);
      });
      return next.size === prev.size ? prev : next;
    });
    setOptimisticPaidPartnerIds((prev) => {
      const next = new Set(prev);
      seeds.forEach((s) => {
        if (s.payment_source === 'joint' && s.is_paid_partner) next.delete(s.id);
      });
      return next.size === prev.size ? prev : next;
    });
    setOptimisticUnpaidMeIds((prev) => {
      const next = new Set(prev);
      seeds.forEach((s) => {
        if (s.payment_source === 'joint' && !s.is_paid_me) next.delete(s.id);
      });
      return next.size === prev.size ? prev : next;
    });
    setOptimisticUnpaidPartnerIds((prev) => {
      const next = new Set(prev);
      seeds.forEach((s) => {
        if (s.payment_source === 'joint' && !s.is_paid_partner) next.delete(s.id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [seeds]);

  const handleMarkPaid = useCallback(
    async (
      seedId: string,
      payer: Payer,
      onRefresh: () => void
    ) => {
      const seed = seeds.find((s) => s.id === seedId);
      const isJoint = seed?.payment_source === 'joint' && household.is_couple;
      if (isJoint && (payer === 'me' || payer === 'partner')) {
        if (payer === 'me') {
          setOptimisticPaidMeIds((p) => new Set(p).add(seedId));
          setOptimisticUnpaidMeIds((p) => {
            const n = new Set(p);
            n.delete(seedId);
            return n;
          });
        } else {
          setOptimisticPaidPartnerIds((p) => new Set(p).add(seedId));
          setOptimisticUnpaidPartnerIds((p) => {
            const n = new Set(p);
            n.delete(seedId);
            return n;
          });
        }
      } else {
        setOptimisticPaidIds((p) => new Set(p).add(seedId));
        setOptimisticUnpaidIds((p) => {
          const n = new Set(p);
          n.delete(seedId);
          return n;
        });
      }
      const result = await markSeedPaid(seedId, payer);
      if ('success' in result) {
        onRefresh();
      } else {
        if (isJoint && (payer === 'me' || payer === 'partner')) {
          payer === 'me'
            ? setOptimisticPaidMeIds((p) => {
                const n = new Set(p);
                n.delete(seedId);
                return n;
              })
            : setOptimisticPaidPartnerIds((p) => {
                const n = new Set(p);
                n.delete(seedId);
                return n;
              });
        } else {
          setOptimisticPaidIds((p) => {
            const n = new Set(p);
            n.delete(seedId);
            return n;
          });
        }
      }
    },
    [seeds, household.is_couple]
  );

  const handleUnmarkPaid = useCallback(
    async (
      seedId: string,
      payer: Payer,
      onRefresh: () => void
    ) => {
      const seed = seeds.find((s) => s.id === seedId);
      const isJoint = seed?.payment_source === 'joint' && household.is_couple;
      if (isJoint && (payer === 'me' || payer === 'partner')) {
        if (payer === 'me') {
          setOptimisticUnpaidMeIds((p) => new Set(p).add(seedId));
          setOptimisticPaidMeIds((p) => {
            const n = new Set(p);
            n.delete(seedId);
            return n;
          });
        } else {
          setOptimisticUnpaidPartnerIds((p) => new Set(p).add(seedId));
          setOptimisticPaidPartnerIds((p) => {
            const n = new Set(p);
            n.delete(seedId);
            return n;
          });
        }
      } else {
        setOptimisticUnpaidIds((p) => new Set(p).add(seedId));
        setOptimisticPaidIds((p) => {
          const n = new Set(p);
          n.delete(seedId);
          return n;
        });
      }
      const result = await unmarkSeedPaid(seedId, payer);
      if ('success' in result) {
        onRefresh();
      } else {
        if (isJoint && (payer === 'me' || payer === 'partner')) {
          payer === 'me'
            ? setOptimisticUnpaidMeIds((p) => {
                const n = new Set(p);
                n.delete(seedId);
                return n;
              })
            : setOptimisticUnpaidPartnerIds((p) => {
                const n = new Set(p);
                n.delete(seedId);
                return n;
              });
        } else {
          setOptimisticUnpaidIds((p) => {
            const n = new Set(p);
            n.delete(seedId);
            return n;
          });
        }
      }
    },
    [seeds, household.is_couple]
  );

  return { displaySeeds, handleMarkPaid, handleUnmarkPaid };
}
