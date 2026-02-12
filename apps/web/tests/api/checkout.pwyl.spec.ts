import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createGetRequest } from './helpers/request';

const { mockCheckoutsCreate } = vi.hoisted(() => ({
  mockCheckoutsCreate: vi.fn(),
}));

vi.mock('@polar-sh/sdk', () => ({
  Polar: class MockPolar {
    checkouts = {
      create: mockCheckoutsCreate,
    };
  },
}));

describe('GET /api/checkout', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.POLAR_ACCESS_TOKEN = 'test-token';
    process.env.POLAR_SUCCESS_URL = 'https://app.example.com/success';
    process.env.POLAR_PWYL_BASE_PRODUCT_ID = 'pwyl-product-id';
    process.env.POLAR_PREMIUM_PRODUCT_ID = 'monthly-product-id';
    process.env.POLAR_PREMIUM_ANNUAL_PRODUCT_ID = 'annual-product-id';
    mockCheckoutsCreate.mockResolvedValue({ url: 'https://sandbox.polar.sh/checkout/mock' });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('Happy – PWYL: creates checkout with PWYL product and metadata', async () => {
    const { GET } = await import('@/app/api/checkout/route');
    const req = createGetRequest('/api/checkout', {
      product: 'pwyl',
      household_id: 'household-123',
      user_id: 'user-456',
    });
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://sandbox.polar.sh/checkout/mock');
    expect(mockCheckoutsCreate).toHaveBeenCalledTimes(1);
    expect(mockCheckoutsCreate).toHaveBeenCalledWith({
      products: ['pwyl-product-id'],
      successUrl: 'https://app.example.com/success',
      metadata: {
        household_id: 'household-123',
        user_id: 'user-456',
        pricing_mode: 'pwyl',
      },
    });
  });

  it('Happy – Fixed monthly: uses POLAR_PREMIUM_PRODUCT_ID and fixed metadata', async () => {
    const { GET } = await import('@/app/api/checkout/route');
    const req = createGetRequest('/api/checkout', {
      product: 'monthly',
      household_id: 'household-123',
    });
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(mockCheckoutsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        products: ['monthly-product-id'],
        metadata: expect.objectContaining({
          household_id: 'household-123',
          pricing_mode: 'fixed',
        }),
      })
    );
  });

  it('Unhappy – Missing product ID (PWYL): returns 400', async () => {
    delete process.env.POLAR_PWYL_BASE_PRODUCT_ID;
    const { GET } = await import('@/app/api/checkout/route');
    const req = createGetRequest('/api/checkout', { product: 'pwyl' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/Missing Polar product ID|POLAR_PWYL_BASE_PRODUCT_ID/);
    expect(mockCheckoutsCreate).not.toHaveBeenCalled();
  });

  it('Unhappy – Missing token or success URL: returns 500', async () => {
    delete process.env.POLAR_ACCESS_TOKEN;
    const { GET } = await import('@/app/api/checkout/route');
    const req = createGetRequest('/api/checkout', { product: 'pwyl', household_id: 'h' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toMatch(/POLAR_ACCESS_TOKEN|POLAR_SUCCESS_URL/);
    expect(mockCheckoutsCreate).not.toHaveBeenCalled();
  });

  it('Unhappy – Polar checkout.create fails: returns 500', async () => {
    mockCheckoutsCreate.mockRejectedValueOnce(new Error('Polar API error'));
    const { GET } = await import('@/app/api/checkout/route');
    const req = createGetRequest('/api/checkout', {
      product: 'pwyl',
      household_id: 'h',
    });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toMatch(/Polar checkout|failed/);
  });
});
