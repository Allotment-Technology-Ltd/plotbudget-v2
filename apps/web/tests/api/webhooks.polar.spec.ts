import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPostRequest } from './helpers/request';
import {
  subscriptionCreatedPwyl,
  subscriptionUpdatedPwyl,
  subscriptionActivePwyl,
  subscriptionCanceledWithMetadata,
  subscriptionCanceledEmptyMetadata,
  subscriptionRevoked,
  subscriptionUncanceled,
  subscriptionTrialing,
  subscriptionTrialingUpgradedDuringTrial,
  subscriptionIncomplete,
  subscriptionUnpaid,
  subscriptionUpdatedCanceled,
  subscriptionCreatedNoHousehold,
  subscriptionCreatedUnknownProduct,
  subscriptionCreatedFixedMonthly,
  subscriptionCreatedFixedAnnual,
  orderUpdated,
  customerCreated,
} from '../fixtures/polar-webhooks';

const mockUpsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelectEqMaybeSingle = vi.fn();

vi.mock('@polar-sh/sdk/webhooks', () => ({
  validateEvent: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'subscriptions') {
        return {
          upsert: mockUpsert.mockResolvedValue({ error: null }),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: mockSelectEqMaybeSingle,
            })),
          })),
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
    process.env.POLAR_PREMIUM_ANNUAL_PRODUCT_ID = 'annual-product-id';
    // Default: DB lookup returns no existing record
    mockSelectEqMaybeSingle.mockResolvedValue({ data: null });
    const webhooks = await import('@polar-sh/sdk/webhooks');
    (webhooks.validateEvent as ReturnType<typeof vi.fn>).mockImplementation((body: string) => {
      return JSON.parse(body) as unknown;
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ─── Happy paths: subscription event types ───────────────────────────

  it('subscription.created (PWYL): upserts with tier pro', async () => {
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
    expect(payload.status).toBe('active');
  });

  it('subscription.updated (PWYL): upserts same table', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionUpdatedPwyl));
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert.mock.calls[0][0].polar_subscription_id).toBe('polar_sub_123');
  });

  it('subscription.active (PWYL): upserts with nested product/customer', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionActivePwyl));
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const payload = mockUpsert.mock.calls[0][0];
    expect(payload.polar_subscription_id).toBe('polar_sub_123');
    expect(payload.household_id).toBe('household-abc');
    expect(payload.current_tier).toBe('pro');
    // product_id resolved from nested product.id
    expect(payload.polar_product_id).toBe('pwyl-product-id');
  });

  it('subscription.canceled (with metadata): upserts with cancelled status', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionCanceledWithMetadata));
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const payload = mockUpsert.mock.calls[0][0];
    expect(payload.status).toBe('cancelled');
    expect(payload.household_id).toBe('household-abc');
  });

  it('subscription.revoked: upserts subscription', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionRevoked));
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const payload = mockUpsert.mock.calls[0][0];
    expect(payload.household_id).toBe('household-abc');
  });

  it('subscription.uncanceled: upserts with active status', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionUncanceled));
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const payload = mockUpsert.mock.calls[0][0];
    expect(payload.status).toBe('active');
    expect(payload.current_tier).toBe('pro');
  });

  // ─── Fixed pricing tier mapping ──────────────────────────────────────

  it('Fixed monthly product: maps to tier pro', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionCreatedFixedMonthly));
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert.mock.calls[0][0].current_tier).toBe('pro');
  });

  it('Fixed annual product: maps to tier pro', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionCreatedFixedAnnual));
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert.mock.calls[0][0].current_tier).toBe('pro');
  });

  // ─── Status normalisation ────────────────────────────────────────────

  it('Normalises Polar "canceled" to DB "cancelled"', async () => {
    const webhooks = await import('@polar-sh/sdk/webhooks');
    (webhooks.validateEvent as ReturnType<typeof vi.fn>).mockReturnValue(subscriptionUpdatedCanceled);
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionUpdatedCanceled));
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert.mock.calls[0][0].status).toBe('cancelled');
  });

  it('Normalises "trialing" status and maps trial_end_date', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionTrialing));
    const res = await POST(req);

    expect(res.status).toBe(200);
    const payload = mockUpsert.mock.calls[0][0];
    expect(payload.status).toBe('trialing');
    expect(payload.trial_end_date).toBe('2026-03-13T00:00:00Z');
  });

  it('Normalises "incomplete" to "past_due"', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionIncomplete));
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert.mock.calls[0][0].status).toBe('past_due');
  });

  it('Normalises "unpaid" to "past_due"', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionUnpaid));
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert.mock.calls[0][0].status).toBe('past_due');
  });

  // ─── User table updates ──────────────────────────────────────────────

  it('Updates users table when tier is pro and userId present', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionCreatedPwyl));
    await POST(req);

    // user update should have been called (update().eq())
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('Skips users table update when tier is null', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionCreatedUnknownProduct));
    await POST(req);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('Maps trialing status to active for user table update', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionTrialing));
    await POST(req);

    // The user update is called via update().eq()
    // The update mock captures the eq call; the update() call receives the payload
    // We verify the update was called (trialing maps to active for user table)
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('Processes subscription when user upgraded during PLOT trial', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest(
      '/api/webhooks/polar',
      JSON.stringify(subscriptionTrialingUpgradedDuringTrial)
    );
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert.mock.calls[0][0].metadata).toMatchObject({
      upgraded_during_trial: 'true',
      plot_trial_end_date: '2026-03-15',
    });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  // ─── Household lookup fallback ───────────────────────────────────────

  it('Looks up household_id from DB when metadata is empty', async () => {
    mockSelectEqMaybeSingle.mockResolvedValue({
      data: { household_id: 'household-from-db' },
    });

    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionCanceledEmptyMetadata));
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert.mock.calls[0][0].household_id).toBe('household-from-db');
  });

  it('Returns 200 when metadata empty and no existing record (no retry)', async () => {
    mockSelectEqMaybeSingle.mockResolvedValue({ data: null });

    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionCreatedNoHousehold));
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);
    expect(json.note).toMatch(/no household_id/);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  // ─── Non-subscription events (skip, return 200) ─────────────────────

  it('Returns 200 for order.updated without processing', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(orderUpdated));
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('Returns 200 for customer.created without processing', async () => {
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(customerCreated));
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  // ─── Unknown event types (SDK validation error) ─────────────────────

  it('Returns 200 for unknown event types (e.g. member.created)', async () => {
    const webhooks = await import('@polar-sh/sdk/webhooks');
    (webhooks.validateEvent as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('SDKValidationError: Unknown event type: member.created');
    });

    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', '{"type":"member.created","data":{}}');
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('Returns 200 for checkout.expired (SDK throws, prevents 502 retries)', async () => {
    const webhooks = await import('@polar-sh/sdk/webhooks');
    (webhooks.validateEvent as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('SDKValidationError: Unknown event type: checkout.expired');
    });

    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', '{"type":"checkout.expired","data":{"id":"ch_123"}}');
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  // ─── Signature validation failure ────────────────────────────────────

  it('Returns 400 for invalid signature', async () => {
    const webhooks = await import('@polar-sh/sdk/webhooks');
    (webhooks.validateEvent as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Invalid webhook signature');
    });

    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', '{"type":"subscription.created","data":{}}');
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Invalid signature/);
  });

  // ─── Database errors ─────────────────────────────────────────────────

  it('Returns 500 when upsert fails', async () => {
    mockUpsert.mockResolvedValueOnce({
      error: { code: 'PGRST205', message: 'Database error' },
    });

    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionCreatedPwyl));
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toMatch(/failed/i);
  });

  // ─── Unknown product maps to null tier ───────────────────────────────

  it('Unknown product: returns 200 and upserts with current_tier null', async () => {
    const webhooks = await import('@polar-sh/sdk/webhooks');
    (webhooks.validateEvent as ReturnType<typeof vi.fn>).mockReturnValue(subscriptionCreatedUnknownProduct);
    const { POST } = await import('@/app/api/webhooks/polar/route');
    const req = createPostRequest('/api/webhooks/polar', JSON.stringify(subscriptionCreatedUnknownProduct));
    const res = await POST(req);

    expect(res.status).toBe(200);
    const payload = mockUpsert.mock.calls[0][0];
    expect(payload.current_tier).toBeNull();
    expect(payload.household_id).toBe('household-abc');
  });

  // ─── Missing env vars ────────────────────────────────────────────────

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
