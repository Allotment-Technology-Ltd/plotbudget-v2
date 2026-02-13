import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPostRequest } from './helpers/request';
import {
  subscriptionCreatedPwyl,
  subscriptionUpdatedPwyl,
  subscriptionUpdatedCanceled,
  subscriptionCreatedNoHousehold,
  subscriptionCreatedUnknownProduct,
} from '../fixtures/polar-webhooks';

const mockUpsert = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@polar-sh/sdk/webhooks', () => ({
  validateEvent: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'subscriptions') {
        return {
          upsert: mockUpsert.mockResolvedValue({ error: null }),
        };
      }
      if (table === 'users') {
        return {
          update: vi.fn(() => ({
            eq: mockUpdate.mockResolvedValue(undefined),
          })),
        };
      }
      return {};
    }),
  })),
}));

describe('POST /api/webhooks/polar', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.POLAR_WEBHOOK_SECRET = 'test-webhook-secret';
    process.env.POLAR_PWYL_BASE_PRODUCT_ID = 'pwyl-product-id';
    process.env.POLAR_PREMIUM_PRODUCT_ID = 'monthly-product-id';
    const webhooks = await import('@polar-sh/sdk/webhooks');
    (webhooks.validateEvent as ReturnType<typeof vi.fn>).mockImplementation((body: string) => {
      return JSON.parse(body) as unknown;
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('Happy – subscription.created (PWYL): upserts with tier pro', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionCreatedPwyl));
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const payload = mockUpsert.mock.calls[0][0];
    expect(payload.polar_subscription_id).toBe('polar_sub_123');
    expect(payload.household_id).toBe('household-abc');
    expect(payload.current_tier).toBe('pro');
    // metadata column not in subscriptions table; pwyl_amount/pricing_mode used for mapTier only
  });

  it('Happy – subscription.updated (PWYL): upserts same table', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionUpdatedPwyl));
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert.mock.calls[0][0].polar_subscription_id).toBe('polar_sub_123');
  });

  it('Unhappy – Missing household_id metadata: returns 400', async () => {
    const webhooks = await import('@polar-sh/sdk/webhooks');
    (webhooks.validateEvent as ReturnType<typeof vi.fn>).mockReturnValue(subscriptionCreatedNoHousehold);
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionCreatedNoHousehold));
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/household_id|metadata/);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('Normalizes Polar "canceled" to DB "cancelled"', async () => {
    const webhooks = await import('@polar-sh/sdk/webhooks');
    (webhooks.validateEvent as ReturnType<typeof vi.fn>).mockReturnValue(subscriptionUpdatedCanceled);
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionUpdatedCanceled));
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const payload = mockUpsert.mock.calls[0][0];
    expect(payload.status).toBe('cancelled');
  });

  it('Unknown product: returns 200 and upserts with current_tier null', async () => {
    const webhooks = await import('@polar-sh/sdk/webhooks');
    (webhooks.validateEvent as ReturnType<typeof vi.fn>).mockReturnValue(subscriptionCreatedUnknownProduct);
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionCreatedUnknownProduct));
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const payload = mockUpsert.mock.calls[0][0];
    expect(payload.current_tier).toBeNull();
    expect(payload.household_id).toBe('household-abc');
  });

  it('Missing POLAR_WEBHOOK_SECRET: returns 500', async () => {
    delete process.env.POLAR_WEBHOOK_SECRET;
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionCreatedPwyl));
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toMatch(/POLAR_WEBHOOK_SECRET|Missing/);
  });
});
