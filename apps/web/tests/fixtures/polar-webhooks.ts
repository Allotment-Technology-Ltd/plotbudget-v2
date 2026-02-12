/**
 * Sample Polar webhook payloads for subscription.created / subscription.updated.
 * Used by tests/api/webhooks.polar.spec.ts with mocked validateEvent.
 */

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

/** Payload with no household_id (unhappy path). */
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

/** Payload with unknown product_id (mapTier returns null). */
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
