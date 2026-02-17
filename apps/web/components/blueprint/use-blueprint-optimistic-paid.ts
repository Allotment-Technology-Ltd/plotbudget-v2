'use client';

import { useReducer, useMemo, useEffect, useCallback } from 'react';
import { markSeedPaid, unmarkSeedPaid } from '@/lib/actions/ritual-actions';
import type { Seed } from '@repo/supabase';
import type { Database } from '@repo/supabase';
import {
  type Payer,
  type OptimisticState,
  initialOptimisticState,
  computeDisplaySeeds,
  pruneOptimisticState,
  applyMarkPaid,
  rollbackMarkPaid,
  applyUnmarkPaid,
  rollbackUnmarkPaid,
} from './blueprint-optimistic-helpers';

type Household = Database['public']['Tables']['households']['Row'];

type SyncAction = { type: 'SYNC'; seeds: Seed[] };
type MarkPaidAction = {
  type: 'MARK_PAID' | 'ROLLBACK_MARK';
  seedId: string;
  payer: Payer;
  isJoint: boolean;
};
type UnmarkPaidAction = {
  type: 'UNMARK_PAID' | 'ROLLBACK_UNMARK';
  seedId: string;
  payer: Payer;
  isJoint: boolean;
};
type Action = SyncAction | MarkPaidAction | UnmarkPaidAction;

function optimisticReducer(
  state: OptimisticState,
  action: Action
): OptimisticState {
  switch (action.type) {
    case 'SYNC':
      return pruneOptimisticState(state, action.seeds);
    case 'MARK_PAID':
      return applyMarkPaid(
        state,
        action.seedId,
        action.payer,
        action.isJoint
      );
    case 'ROLLBACK_MARK':
      return rollbackMarkPaid(
        state,
        action.seedId,
        action.payer,
        action.isJoint
      );
    case 'UNMARK_PAID':
      return applyUnmarkPaid(
        state,
        action.seedId,
        action.payer,
        action.isJoint
      );
    case 'ROLLBACK_UNMARK':
      return rollbackUnmarkPaid(
        state,
        action.seedId,
        action.payer,
        action.isJoint
      );
    default:
      return state;
  }
}

export function useBlueprintOptimisticPaid(seeds: Seed[], household: Household) {
  const [state, dispatch] = useReducer(
    optimisticReducer,
    initialOptimisticState
  );

  useEffect(() => {
    dispatch({ type: 'SYNC', seeds });
  }, [seeds]);

  const displaySeeds = useMemo(
    () => computeDisplaySeeds(seeds, state, !!household.is_couple),
    [seeds, state, household.is_couple]
  );

  const handleMarkPaid = useCallback(
    async (seedId: string, payer: Payer, onRefresh: () => void) => {
      const seed = seeds.find((s) => s.id === seedId);
      const isJoint =
        (seed?.payment_source === 'joint') && !!household.is_couple;

      dispatch({ type: 'MARK_PAID', seedId, payer, isJoint });

      const result = await markSeedPaid(seedId, payer);
      if ('success' in result) {
        onRefresh();
      } else {
        dispatch({ type: 'ROLLBACK_MARK', seedId, payer, isJoint });
      }
    },
    [seeds, household.is_couple]
  );

  const handleUnmarkPaid = useCallback(
    async (seedId: string, payer: Payer, onRefresh: () => void) => {
      const seed = seeds.find((s) => s.id === seedId);
      const isJoint =
        (seed?.payment_source === 'joint') && !!household.is_couple;

      dispatch({ type: 'UNMARK_PAID', seedId, payer, isJoint });

      const result = await unmarkSeedPaid(seedId, payer);
      if ('success' in result) {
        onRefresh();
      } else {
        dispatch({ type: 'ROLLBACK_UNMARK', seedId, payer, isJoint });
      }
    },
    [seeds, household.is_couple]
  );

  return { displaySeeds, handleMarkPaid, handleUnmarkPaid };
}
