import { NextRequest } from 'next/server';

const BASE = 'http://localhost:3000';

/**
 * Build a NextRequest for API route tests with optional query params.
 */
export function createGetRequest(path: string, params?: Record<string, string>): NextRequest {
  const url = new URL(path, BASE);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  return new NextRequest(url, { method: 'GET' });
}

/**
 * Build a NextRequest for POST with a JSON body (e.g. webhooks).
 */
export function createPostRequest(path: string, body: string, headers?: Record<string, string>): NextRequest {
  const url = new URL(path, BASE);
  const h = new Headers(headers ?? {});
  if (body && !h.has('Content-Type')) {
    h.set('Content-Type', 'application/json');
  }
  return new NextRequest(url, { method: 'POST', body, headers: h });
}
