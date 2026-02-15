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
      data: [
        { id: 'u1', household_id: 'h1' },
        { id: 'u2', household_id: 'h1' },
        { id: 'u3', household_id: 'h2' },
        ...Array.from({ length: 16 }, (_, i) => ({ id: `u${i + 4}`, household_id: `h${i + 3}` })),
      ],
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
      limit: 50,
      showCountdown: true,
    });
    expect(json.spotsLeft).toBeGreaterThanOrEqual(0);
    expect(json.spotsLeft).toBeLessThanOrEqual(50);
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockSelect).toHaveBeenCalledWith('id, household_id');
    expect(mockNot).toHaveBeenCalledWith('founding_member_until', 'is', null);
  });

  it('showCountdown is false when founder households < 17', async () => {
    mockNot.mockResolvedValue({
      data: [
        { id: 'u1', household_id: 'h1' },
        { id: 'u2', household_id: 'h2' },
      ],
      error: null,
    });

    const { GET } = await import('@/app/api/public/founding-spots/route');
    const req = createGetRequest('/api/public/founding-spots');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.showCountdown).toBe(false);
    expect(json.spotsLeft).toBe(48);
    expect(json.limit).toBe(50);
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
