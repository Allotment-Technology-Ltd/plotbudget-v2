/**
 * Sample Polar webhook payloads for subscription lifecycle events.
 * Used by tests/api/webhooks.polar.spec.ts with mocked validateEvent.
 */

// --- Happy path: subscription.created ---
export const subscriptionCreatedPwyl = {
  type: 'subscription.created',
  data: {
    id: 'polar_sub_123',
    status: 'active',
    product_id: 'pwyl-product-id',
    price_id: 'price_pwyl_123',
    customer_id: 'customer_123',
    metadata: {
      household_id: 'household-abc',
      user_id: 'user-xyz',
      pwyl_amount: '5.00',
      pricing_mode: 'pwyl',
    },
    trial_ends_at: null,
  },
};

// --- Happy path: subscription.updated ---
export const subscriptionUpdatedPwyl = {
  type: 'subscription.updated',
  data: {
    id: 'polar_sub_123',
    status: 'active',
    product_id: 'pwyl-product-id',
    metadata: {
      household_id: 'household-abc',
      user_id: 'user-xyz',
      pwyl_amount: '3.50',
      pricing_mode: 'pwyl',
    },
    trial_ends_at: null,
  },
};

// --- Happy path: subscription.active (newer Polar event) ---
export const subscriptionActivePwyl = {
  type: 'subscription.active',
  data: {
    id: 'polar_sub_123',
    status: 'active',
    // Newer Polar events may use nested product/customer objects
    product: { id: 'pwyl-product-id', name: 'PWYL Premium' },
    customer: { id: 'customer_123' },
    metadata: {
      household_id: 'household-abc',
      user_id: 'user-xyz',
      pricing_mode: 'pwyl',
    },
    trial_ends_at: null,
  },
};

// --- Happy path: subscription.canceled with metadata ---
export const subscriptionCanceledWithMetadata = {
  type: 'subscription.canceled',
  data: {
    id: 'polar_sub_123',
    status: 'canceled',
    product_id: 'pwyl-product-id',
    customer_id: 'customer_123',
    metadata: {
      household_id: 'household-abc',
      user_id: 'user-xyz',
      pricing_mode: 'pwyl',
    },
    trial_ends_at: null,
  },
};

// --- Lifecycle: subscription.canceled with empty metadata (needs DB lookup) ---
export const subscriptionCanceledEmptyMetadata = {
  type: 'subscription.canceled',
  data: {
    id: 'polar_sub_123',
    status: 'canceled',
    metadata: {},
    trial_ends_at: null,
  },
};

// --- Lifecycle: subscription.revoked ---
export const subscriptionRevoked = {
  type: 'subscription.revoked',
  data: {
    id: 'polar_sub_123',
    status: 'revoked',
    metadata: {
      household_id: 'household-abc',
      user_id: 'user-xyz',
      pricing_mode: 'pwyl',
    },
    trial_ends_at: null,
  },
};

// --- Lifecycle: subscription.uncanceled ---
export const subscriptionUncanceled = {
  type: 'subscription.uncanceled',
  data: {
    id: 'polar_sub_123',
    status: 'active',
    product_id: 'pwyl-product-id',
    customer_id: 'customer_123',
    metadata: {
      household_id: 'household-abc',
      user_id: 'user-xyz',
      pricing_mode: 'pwyl',
    },
    trial_ends_at: null,
  },
};

// --- Status: trialing ---
export const subscriptionTrialing = {
  type: 'subscription.created',
  data: {
    id: 'polar_sub_trial',
    status: 'trialing',
    product_id: 'pwyl-product-id',
    customer_id: 'customer_123',
    metadata: {
      household_id: 'household-abc',
      user_id: 'user-xyz',
      pricing_mode: 'pwyl',
    },
    trial_ends_at: '2026-03-13T00:00:00Z',
  },
};

// --- Upgraded during PLOT trial: user pays before trial ends, first charge deferred ---
export const subscriptionTrialingUpgradedDuringTrial = {
  type: 'subscription.created',
  data: {
    id: 'polar_sub_trial_upgrade',
    status: 'trialing',
    product_id: 'pwyl-product-id',
    customer_id: 'customer_123',
    metadata: {
      household_id: 'household-abc',
      user_id: 'user-xyz',
      pricing_mode: 'pwyl',
      upgraded_during_trial: 'true',
      plot_trial_end_date: '2026-03-15',
    },
    trial_ends_at: '2026-03-15T23:59:59Z',
  },
};

// --- Status edge cases ---
export const subscriptionIncomplete = {
  type: 'subscription.updated',
  data: {
    id: 'polar_sub_123',
    status: 'incomplete',
    product_id: 'pwyl-product-id',
    metadata: { household_id: 'household-abc', user_id: 'user-xyz', pricing_mode: 'pwyl' },
    trial_ends_at: null,
  },
};

export const subscriptionUnpaid = {
  type: 'subscription.updated',
  data: {
    id: 'polar_sub_123',
    status: 'unpaid',
    product_id: 'pwyl-product-id',
    metadata: { household_id: 'household-abc', user_id: 'user-xyz', pricing_mode: 'pwyl' },
    trial_ends_at: null,
  },
};

// --- Unhappy: no household_id in metadata, no existing record ---
export const subscriptionCreatedNoHousehold = {
  type: 'subscription.created',
  data: {
    id: 'polar_sub_456',
    status: 'active',
    product_id: 'unknown-product',
    metadata: {},
    trial_ends_at: null,
  },
};

// --- Status: Polar US spelling "canceled" ---
export const subscriptionUpdatedCanceled = {
  type: 'subscription.updated',
  data: {
    id: 'polar_sub_123',
    status: 'canceled',
    product_id: 'pwyl-product-id',
    metadata: {
      household_id: 'household-abc',
      user_id: 'user-xyz',
    },
    trial_ends_at: null,
  },
};

// --- Unhappy: unknown product ---
export const subscriptionCreatedUnknownProduct = {
  type: 'subscription.created',
  data: {
    id: 'polar_sub_789',
    status: 'active',
    product_id: 'unknown-product-id',
    metadata: {
      household_id: 'household-abc',
      user_id: 'user-xyz',
    },
    trial_ends_at: null,
  },
};

// --- Non-subscription events (should return 200, skip processing) ---
export const orderUpdated = {
  type: 'order.updated',
  data: {
    id: 'order_123',
    status: 'paid',
    metadata: {},
  },
};

export const customerCreated = {
  type: 'customer.created',
  data: {
    id: 'cust_123',
    status: 'active',
    metadata: {},
  },
};

// --- Fixed pricing: monthly product ---
export const subscriptionCreatedFixedMonthly = {
  type: 'subscription.created',
  data: {
    id: 'polar_sub_fixed_monthly',
    status: 'active',
    product_id: 'monthly-product-id',
    customer_id: 'customer_456',
    metadata: {
      household_id: 'household-def',
      user_id: 'user-fixed',
      pricing_mode: 'fixed',
    },
    trial_ends_at: null,
  },
};

// --- Fixed pricing: annual product ---
export const subscriptionCreatedFixedAnnual = {
  type: 'subscription.created',
  data: {
    id: 'polar_sub_fixed_annual',
    status: 'active',
    product_id: 'annual-product-id',
    customer_id: 'customer_789',
    metadata: {
      household_id: 'household-ghi',
      user_id: 'user-annual',
      pricing_mode: 'fixed',
    },
    trial_ends_at: null,
  },
};
