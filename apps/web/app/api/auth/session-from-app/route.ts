/**
 * POST /api/auth/session-from-app
 * Native app sends current session; returns a one-time URL to open in the browser
 * so the user is logged in on web without re-entering credentials.
 * Requires Authorization: Bearer <access_token>. Body: { session: Session } (from getSession()).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';
import { createAdminClient } from '@/lib/supabase/admin';
import { randomUUID } from 'crypto';

const CODE_TTL_SECONDS = 120;

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  );
}

function parseBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

function validateSessionPayload(body: { session?: unknown }): { session: object } | { error: string } {
  const session = body.session;
  if (!session || typeof session !== 'object' || !('access_token' in session) || !('refresh_token' in session)) {
    return { error: 'Body must include { session } with access_token and refresh_token' };
  }
  return { session: session as object };
}

async function insertHandoffCode(
  admin: ReturnType<typeof createAdminClient>,
  code: string,
  session: object,
  expiresAt: Date
): Promise<{ error?: unknown }> {
  const { error } = await (admin as unknown as { from: (t: string) => { insert: (row: object) => Promise<{ error?: unknown }> } })
    .from('auth_handoff')
    .insert({
      code,
      session_payload: JSON.stringify(session),
      expires_at: expiresAt.toISOString(),
    });
  return error != null ? { error } : {};
}

function buildHandoffUrl(baseUrl: string, code: string, redirectPath: string): string {
  const base = baseUrl.replace(/\/$/, '');
  return `${base}/auth/from-app?code=${encodeURIComponent(code)}&returnTo=${encodeURIComponent(redirectPath)}`;
}

export async function POST(request: NextRequest) {
  const token = parseBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_APP_URL or VERCEL_URL not set' },
      { status: 500 }
    );
  }

  let body: { session?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validated = validateSessionPayload(body);
  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }
  const { session } = validated;

  const supabase = createSupabaseClientFromToken(token);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionObj = session as { user?: { id?: string } };
  if (sessionObj.user?.id && sessionObj.user.id !== user.id) {
    return NextResponse.json({ error: 'Session user mismatch' }, { status: 400 });
  }

  const code = randomUUID();
  const expiresAt = new Date(Date.now() + CODE_TTL_SECONDS * 1000);
  const admin = createAdminClient();
  const insertResult = await insertHandoffCode(admin, code, session, expiresAt);
  if (insertResult.error) {
    console.error('[session-from-app] insert failed:', insertResult.error);
    return NextResponse.json({ error: 'Failed to create handoff code' }, { status: 500 });
  }

  const redirectPath = request.nextUrl.searchParams.get('path') ?? '/dashboard';
  const handoffUrl = buildHandoffUrl(baseUrl, code, redirectPath);
  return NextResponse.json({ url: handoffUrl });
}
