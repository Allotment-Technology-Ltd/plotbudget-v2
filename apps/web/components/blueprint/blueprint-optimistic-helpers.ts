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

export const initialOptimisticState: OptimisticState = {
  paidIds: new Set(),
  unpaidIds: new Set(),
  paidMeIds: new Set(),
  paidPartnerIds: new Set(),
  unpaidMeIds: new Set(),
  unpaidPartnerIds: new Set(),
};

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

/** Prune optimistic sets when server seeds have caught up. Returns new state only if changed. */
export function pruneOptimisticState(
  prev: OptimisticState,
  seeds: Seed[]
): OptimisticState {
  const pruneSet = (
    set: Set<string>,
    shouldRemove: (s: Seed) => boolean
  ): Set<string> => {
    const next = new Set(set);
    seeds.forEach((s) => {
      if (shouldRemove(s)) next.delete(s.id);
    });
    return next.size === set.size ? set : next;
  };

  const paidIds = pruneSet(prev.paidIds, (s) => s.is_paid);
  const unpaidIds = pruneSet(prev.unpaidIds, (s) => !s.is_paid);
  const paidMeIds = pruneSet(
    prev.paidMeIds,
    (s) => s.payment_source === 'joint' && !!s.is_paid_me
  );
  const paidPartnerIds = pruneSet(
    prev.paidPartnerIds,
    (s) => s.payment_source === 'joint' && !!s.is_paid_partner
  );
  const unpaidMeIds = pruneSet(
    prev.unpaidMeIds,
    (s) => s.payment_source === 'joint' && !s.is_paid_me
  );
  const unpaidPartnerIds = pruneSet(
    prev.unpaidPartnerIds,
    (s) => s.payment_source === 'joint' && !s.is_paid_partner
  );

  if (
    paidIds === prev.paidIds &&
    unpaidIds === prev.unpaidIds &&
    paidMeIds === prev.paidMeIds &&
    paidPartnerIds === prev.paidPartnerIds &&
    unpaidMeIds === prev.unpaidMeIds &&
    unpaidPartnerIds === prev.unpaidPartnerIds
  ) {
    return prev;
  }

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
