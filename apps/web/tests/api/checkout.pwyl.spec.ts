import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createGetRequest } from './helpers/request';

const { mockCheckoutsCreate } = vi.hoisted(() => ({
  mockCheckoutsCreate: vi.fn(),
}));

// Mock user returned by auth (using real domain, not .test)
const MOCK_USER = { id: 'user-456', email: 'test@example.com' };
// Mock household data
const MOCK_OWNED_HOUSEHOLD = { id: 'household-123' };
// Mock user profile (not in trial so route does not query paycycles)
const MOCK_USER_PROFILE = { display_name: 'Test User', trial_cycles_completed: 2 };

vi.mock('@polar-sh/sdk', () => ({
  Polar: class MockPolar {
    checkouts = {
      create: mockCheckoutsCreate,
    };
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: MOCK_USER } }),
    },
    from: vi.fn((table: string) => {
      if (table === 'households') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string) => {
              // owner_id query returns household; partner_user_id returns null
              if (col === 'owner_id') return { maybeSingle: vi.fn().mockResolvedValue({ data: MOCK_OWNED_HOUSEHOLD }) };
              return { maybeSingle: vi.fn().mockResolvedValue({ data: null }) };
            }),
          })),
        };
      }
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: MOCK_USER_PROFILE }),
            })),
          })),
        };
      }
      return {};
    }),
  })),
}));

describe('GET /api/checkout (authenticated)', () => {
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

  it('Happy – PWYL: creates checkout with server-resolved household_id and user_id', async () => {
    const { GET } = await import('@/app/api/checkout/route');
    // Note: no household_id or user_id in query params — resolved server-side
    const req = createGetRequest('/api/checkout', { product: 'pwyl' });
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://sandbox.polar.sh/checkout/mock');
    expect(mockCheckoutsCreate).toHaveBeenCalledTimes(1);
    expect(mockCheckoutsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        products: ['pwyl-product-id'],
        successUrl: 'https://app.example.com/success',
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        metadata: {
          household_id: 'household-123',
          user_id: 'user-456',
          pricing_mode: 'pwyl',
        },
      }),
    );
  });

  it('Uses request origin for success URL when POLAR_SUCCESS_URL is unset', async () => {
    delete process.env.POLAR_SUCCESS_URL;
    const { GET } = await import('@/app/api/checkout/route');
    const req = createGetRequest('/api/checkout', { product: 'pwyl' });
    await GET(req);

    expect(mockCheckoutsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        successUrl: 'http://localhost:3000/dashboard?checkout_id={CHECKOUT_ID}',
      }),
    );
  });

  it('Happy – Fixed monthly: uses POLAR_PREMIUM_PRODUCT_ID with server-resolved metadata', async () => {
    const { GET } = await import('@/app/api/checkout/route');
    const req = createGetRequest('/api/checkout', { product: 'monthly' });
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(mockCheckoutsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        products: ['monthly-product-id'],
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        metadata: expect.objectContaining({
          household_id: 'household-123',
          user_id: 'user-456',
          pricing_mode: 'fixed',
        }),
      }),
    );
  });

  it('Happy – Test email (.test domain): skips customer_email to avoid Polar validation error', async () => {
    // Override mock to return test domain email
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    (createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-456', email: 'test@plotbudget.test' } } }),
      },
      from: vi.fn((table: string) => {
        if (table === 'households') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn((col: string) => {
                if (col === 'owner_id') return { maybeSingle: vi.fn().mockResolvedValue({ data: MOCK_OWNED_HOUSEHOLD }) };
                return { maybeSingle: vi.fn().mockResolvedValue({ data: null }) };
              }),
            })),
          };
        }
        if (table === 'users') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: MOCK_USER_PROFILE }),
              })),
            })),
          };
        }
        return {};
      }),
    });

    const { GET } = await import('@/app/api/checkout/route');
    const req = createGetRequest('/api/checkout', { product: 'pwyl' });
    const res = await GET(req);

    expect(res.status).toBe(302);
    const callArgs = mockCheckoutsCreate.mock.calls[0][0];
    // Should NOT include customer_email when it's a .test domain
    expect(callArgs.customer_email).toBeUndefined();
    // Should still include name and metadata
    expect(callArgs.customer_name).toBe('Test User');
    expect(callArgs.metadata).toEqual({
      household_id: 'household-123',
      user_id: 'user-456',
      pricing_mode: 'pwyl',
    });
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

  it('Unhappy – Missing token: returns 500', async () => {
    delete process.env.POLAR_ACCESS_TOKEN;
    const { GET } = await import('@/app/api/checkout/route');
    const req = createGetRequest('/api/checkout', { product: 'pwyl' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toMatch(/POLAR_ACCESS_TOKEN/);
    expect(mockCheckoutsCreate).not.toHaveBeenCalled();
  });

  it('Unhappy – Polar checkout.create fails: returns 500', async () => {
    mockCheckoutsCreate.mockRejectedValueOnce(new Error('Polar API error'));
    const { GET } = await import('@/app/api/checkout/route');
    const req = createGetRequest('/api/checkout', { product: 'pwyl' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toMatch(/Polar checkout|failed/);
  });

  it('Happy – Fixed annual: uses POLAR_PREMIUM_ANNUAL_PRODUCT_ID', async () => {
    const { GET } = await import('@/app/api/checkout/route');
    const req = createGetRequest('/api/checkout', { product: 'annual' });
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(mockCheckoutsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        products: ['annual-product-id'],
        metadata: expect.objectContaining({
          pricing_mode: 'fixed',
        }),
      }),
    );
  });

  it('Unhappy – No household found: returns 400', async () => {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    (createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: MOCK_USER } }),
      },
      from: vi.fn((table: string) => {
        if (table === 'households') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              })),
            })),
          };
        }
        if (table === 'users') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              })),
            })),
          };
        }
        return {};
      }),
    });

    const { GET } = await import('@/app/api/checkout/route');
    const req = createGetRequest('/api/checkout', { product: 'pwyl' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toMatch(/household|onboarding/i);
    expect(mockCheckoutsCreate).not.toHaveBeenCalled();
  });

  it('Unhappy – Checkout created without URL: returns 500', async () => {
    mockCheckoutsCreate.mockResolvedValueOnce({ url: null });
    const { GET } = await import('@/app/api/checkout/route');
    const req = createGetRequest('/api/checkout', { product: 'pwyl' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toMatch(/URL/i);
  });
});

describe('GET /api/checkout (unauthenticated)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.POLAR_ACCESS_TOKEN = 'test-token';
    process.env.POLAR_SUCCESS_URL = 'https://app.example.com/success';
    process.env.POLAR_PWYL_BASE_PRODUCT_ID = 'pwyl-product-id';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('Redirects unauthenticated users to /login', async () => {
    // Override mock to return no user
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    (createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    const { GET } = await import('@/app/api/checkout/route');
    const req = createGetRequest('/api/checkout', { product: 'pwyl' });
    const res = await GET(req);

    expect(res.status).toBe(302);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('/login');
    expect(location).toContain('redirect=');
  });
});
