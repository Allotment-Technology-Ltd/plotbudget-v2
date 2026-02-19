/**
 * Public API: GET /api/public/founding-spots
 * Returns spotsLeft, limit, showCountdown for marketing countdown.
 * showCountdown is true only when at least 17 founder households exist.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGetRequest } from './helpers/request';

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockNot = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe('GET /api/public/founding-spots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      not: mockNot,
    });
  });

  it('returns spotsLeft, limit, showCountdown with CORS headers', async () => {
    mockNot.mockResolvedValue({
      data: Array.from({ length: 20 }, (_, i) => ({ id: `h${i + 1}` })),
      error: null,
    });

    const { GET } = await import('@/app/api/public/founding-spots/route');
    const req = createGetRequest('/api/public/founding-spots');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    expect(json).toMatchObject({
      spotsLeft: expect.any(Number),
      limit: 100,
      showCountdown: true,
    });
    expect(json.spotsLeft).toBeGreaterThanOrEqual(0);
    expect(json.spotsLeft).toBeLessThanOrEqual(100);
    expect(mockFrom).toHaveBeenCalledWith('households');
    expect(mockSelect).toHaveBeenCalledWith('id');
    expect(mockNot).toHaveBeenCalledWith('founding_member_until', 'is', null);
  });

  it('showCountdown is false when founder households < 17', async () => {
    mockNot.mockResolvedValue({
      data: [{ id: 'h1' }, { id: 'h2' }],
      error: null,
    });

    const { GET } = await import('@/app/api/public/founding-spots/route');
    const req = createGetRequest('/api/public/founding-spots');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.showCountdown).toBe(false);
    expect(json.spotsLeft).toBe(98);
    expect(json.limit).toBe(100);
  });

  it('returns 500 when Supabase errors', async () => {
    mockNot.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const { GET } = await import('@/app/api/public/founding-spots/route');
    const req = createGetRequest('/api/public/founding-spots');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe('Unable to fetch spots');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
  });
});

describe('OPTIONS /api/public/founding-spots', () => {
  it('returns 204 with CORS headers', async () => {
    const { OPTIONS } = await import('@/app/api/public/founding-spots/route');
    const req = createGetRequest('/api/public/founding-spots');
    const res = await OPTIONS(req);

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });
});
