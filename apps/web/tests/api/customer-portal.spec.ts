import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createGetRequest } from './helpers/request';

const mockCustomerSessionsCreate = vi.fn();

vi.mock('@polar-sh/sdk', () => ({
  Polar: class MockPolar {
    customerSessions = {
      create: mockCustomerSessionsCreate,
    };
  },
}));

const MOCK_USER = { id: 'user-456', email: 'test@example.com' };

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: MOCK_USER } }),
    },
    from: vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { polar_customer_id: 'polar_cust_abc' },
              }),
            })),
          })),
        };
      }
      return {};
    }),
  })),
}));

describe('GET /api/customer-portal', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.POLAR_ACCESS_TOKEN = 'test-token';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('Happy – redirects to Polar customer portal URL', async () => {
    mockCustomerSessionsCreate.mockResolvedValue({
      customerPortalUrl: 'https://sandbox.polar.sh/portal/session-xyz',
    });

    const { GET } = await import('@/app/api/customer-portal/route');
    const req = createGetRequest('/api/customer-portal');
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://sandbox.polar.sh/portal/session-xyz');
    expect(mockCustomerSessionsCreate).toHaveBeenCalledWith({
      customerId: 'polar_cust_abc',
      returnUrl: expect.stringContaining('/dashboard/settings?tab=subscription'),
    });
  });

  it('Redirects to /pricing when user has no polar_customer_id', async () => {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    (createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: MOCK_USER } }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { polar_customer_id: null },
            }),
          })),
        })),
      })),
    });

    const { GET } = await import('@/app/api/customer-portal/route');
    const req = createGetRequest('/api/customer-portal');
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/pricing');
  });

  it('Redirects to /login when unauthenticated', async () => {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    (createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    const { GET } = await import('@/app/api/customer-portal/route');
    const req = createGetRequest('/api/customer-portal');
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('Redirects to settings with portal_error when Polar session creation fails', async () => {
    mockCustomerSessionsCreate.mockRejectedValueOnce(new Error('Polar error'));

    const { GET } = await import('@/app/api/customer-portal/route');
    const req = createGetRequest('/api/customer-portal');
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain('portal_error=true');
  });

  it('Returns 500 when POLAR_ACCESS_TOKEN is missing', async () => {
    delete process.env.POLAR_ACCESS_TOKEN;

    const { GET } = await import('@/app/api/customer-portal/route');
    const req = createGetRequest('/api/customer-portal');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/POLAR_ACCESS_TOKEN/);
  });
});
