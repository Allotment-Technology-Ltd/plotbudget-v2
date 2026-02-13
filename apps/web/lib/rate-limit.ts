/**
 * Rate limiting for auth and sensitive routes (open banking / security standard).
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
 * When not set, allows all requests (no-op) so the app works without Redis.
 *
 * Usage: call checkRateLimit(identifier, 'auth') from middleware or API routes.
 * Set in Vercel: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (free tier at upstash.com).
 */

const AUTH_LIMIT = 10; // requests per window
const AUTH_WINDOW_SEC = 60;

export type RateLimitKey = 'auth' | 'api-sensitive';

async function getLimiter() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url, token });
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(AUTH_LIMIT, `${AUTH_WINDOW_SEC} s`),
      analytics: false,
    });
  } catch {
    return null;
  }
}

/**
 * Returns true if the request is allowed, false if rate limited.
 * Identifier should be IP or user id (e.g. from x-forwarded-for or x-real-ip).
 */
export async function checkRateLimit(
  identifier: string,
  _key: RateLimitKey
): Promise<{ allowed: boolean }> {
  const limiter = await getLimiter();
  if (!limiter) return { allowed: true };
  const { success } = await limiter.limit(identifier);
  return { allowed: success };
}
