import type { Seed } from '@repo/supabase';

export type Payer = 'me' | 'partner' | 'both';

export type OptimisticState = {
  paidIds: Set<string>;
  unpaidIds: Set<string>;
  paidMeIds: Set<string>;
  paidPartnerIds: Set<string>;
  unpaidMeIds: Set<string>;
  unpaidPartnerIds: Set<string>;
};

/** Returns fresh initial state. Use per hook instance to avoid shared mutable Sets. */
export function createInitialOptimisticState(): OptimisticState {
  return {
    paidIds: new Set(),
    unpaidIds: new Set(),
    paidMeIds: new Set(),
    paidPartnerIds: new Set(),
    unpaidMeIds: new Set(),
    unpaidPartnerIds: new Set(),
  };
}

/** Apply optimistic state to seeds for display. Pure function. */
export function computeDisplaySeeds(
  seeds: Seed[],
  state: OptimisticState,
  isCouple: boolean
): Seed[] {
  return seeds.map((s) => {
    const isJoint = s.payment_source === 'joint' && isCouple;
    if (isJoint) {
      const isPaidMe =
        (s.is_paid_me || state.paidMeIds.has(s.id)) &&
        !state.unpaidMeIds.has(s.id);
      const isPaidPartner =
        (s.is_paid_partner || state.paidPartnerIds.has(s.id)) &&
        !state.unpaidPartnerIds.has(s.id);
      return {
        ...s,
        is_paid_me: isPaidMe,
        is_paid_partner: isPaidPartner,
        is_paid: isPaidMe && isPaidPartner,
      };
    }
    if (state.unpaidIds.has(s.id)) {
      return { ...s, is_paid: false, is_paid_me: false, is_paid_partner: false };
    }
    if (state.paidIds.has(s.id)) {
      return {
        ...s,
        is_paid: true,
        is_paid_me: true,
        is_paid_partner: s.is_paid_partner,
      };
    }
    return s;
  });
}

/** Prune optimistic sets when server seeds have caught up. Single pass O(n). Returns new state only if changed. */
export function pruneOptimisticState(
  prev: OptimisticState,
  seeds: Seed[]
): OptimisticState {
  const paidIds = new Set(prev.paidIds);
  const unpaidIds = new Set(prev.unpaidIds);
  const paidMeIds = new Set(prev.paidMeIds);
  const paidPartnerIds = new Set(prev.paidPartnerIds);
  const unpaidMeIds = new Set(prev.unpaidMeIds);
  const unpaidPartnerIds = new Set(prev.unpaidPartnerIds);

  let changed = false;
  for (const s of seeds) {
    if (s.is_paid && paidIds.delete(s.id)) changed = true;
    if (!s.is_paid && unpaidIds.delete(s.id)) changed = true;
    if (s.payment_source === 'joint') {
      if (s.is_paid_me && paidMeIds.delete(s.id)) changed = true;
      if (s.is_paid_partner && paidPartnerIds.delete(s.id)) changed = true;
      if (!s.is_paid_me && unpaidMeIds.delete(s.id)) changed = true;
      if (!s.is_paid_partner && unpaidPartnerIds.delete(s.id)) changed = true;
    }
  }

  if (!changed) return prev;

  return {
    paidIds,
    unpaidIds,
    paidMeIds,
    paidPartnerIds,
    unpaidMeIds,
    unpaidPartnerIds,
  };
}

function addToSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  next.add(id);
  return next;
}

function removeFromSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  next.delete(id);
  return next;
}

/** Apply optimistic mark-paid. Returns new state. */
export function applyMarkPaid(
  state: OptimisticState,
  seedId: string,
  payer: Payer,
  isJoint: boolean
): OptimisticState {
  if (isJoint && (payer === 'me' || payer === 'partner')) {
    if (payer === 'me') {
      return {
        ...state,
        paidMeIds: addToSet(state.paidMeIds, seedId),
        unpaidMeIds: removeFromSet(state.unpaidMeIds, seedId),
      };
    }
    return {
      ...state,
      paidPartnerIds: addToSet(state.paidPartnerIds, seedId),
      unpaidPartnerIds: removeFromSet(state.unpaidPartnerIds, seedId),
    };
  }
  return {
    ...state,
    paidIds: addToSet(state.paidIds, seedId),
    unpaidIds: removeFromSet(state.unpaidIds, seedId),
  };
}

/** Rollback optimistic mark-paid on server error. Returns new state. */
export function rollbackMarkPaid(
  state: OptimisticState,
  seedId: string,
  payer: Payer,
  isJoint: boolean
): OptimisticState {
  if (isJoint && (payer === 'me' || payer === 'partner')) {
    if (payer === 'me') {
      return {
        ...state,
        paidMeIds: removeFromSet(state.paidMeIds, seedId),
      };
    }
    return {
      ...state,
      paidPartnerIds: removeFromSet(state.paidPartnerIds, seedId),
    };
  }
  return {
    ...state,
    paidIds: removeFromSet(state.paidIds, seedId),
  };
}

/** Apply optimistic unmark-paid. Returns new state. */
export function applyUnmarkPaid(
  state: OptimisticState,
  seedId: string,
  payer: Payer,
  isJoint: boolean
): OptimisticState {
  if (isJoint && (payer === 'me' || payer === 'partner')) {
    if (payer === 'me') {
      return {
        ...state,
        unpaidMeIds: addToSet(state.unpaidMeIds, seedId),
        paidMeIds: removeFromSet(state.paidMeIds, seedId),
      };
    }
    return {
      ...state,
      unpaidPartnerIds: addToSet(state.unpaidPartnerIds, seedId),
      paidPartnerIds: removeFromSet(state.paidPartnerIds, seedId),
    };
  }
  return {
    ...state,
    unpaidIds: addToSet(state.unpaidIds, seedId),
    paidIds: removeFromSet(state.paidIds, seedId),
  };
}

/** Rollback optimistic unmark-paid on server error. Returns new state. */
export function rollbackUnmarkPaid(
  state: OptimisticState,
  seedId: string,
  payer: Payer,
  isJoint: boolean
): OptimisticState {
  if (isJoint && (payer === 'me' || payer === 'partner')) {
    if (payer === 'me') {
      return {
        ...state,
        unpaidMeIds: removeFromSet(state.unpaidMeIds, seedId),
      };
    }
    return {
      ...state,
      unpaidPartnerIds: removeFromSet(state.unpaidPartnerIds, seedId),
    };
  }
  return {
    ...state,
    unpaidIds: removeFromSet(state.unpaidIds, seedId),
  };
}
