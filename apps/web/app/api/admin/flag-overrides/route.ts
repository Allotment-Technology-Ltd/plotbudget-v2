/**
 * POST /api/admin/flag-overrides
 * Set admin flag override cookie (pre-production only). Body: { moduleFlags: Partial<ModuleFlags> }.
 * Only admins; cookie is applied when getServerFeatureFlags is called with cookies + isAdmin in pre-prod.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminUser } from '@/lib/auth/admin-gate';
import { isPreProdContext } from '@/lib/feature-flags';
import { ADMIN_FLAG_OVERRIDE_COOKIE, type AdminFlagOverrides } from '@/lib/posthog-server-flags';
import type { ModuleFlagId } from '@/lib/module-flags';

const MODULE_IDS: ModuleFlagId[] = [
  'money',
  'home',
  'tasks',
  'calendar',
  'meals',
  'holidays',
  'vault',
  'kids',
];

/** Returns overrides object; empty object means "clear overrides". */
function parseBody(body: unknown): AdminFlagOverrides | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  const moduleFlags = b.moduleFlags;
  if (typeof moduleFlags !== 'object' || moduleFlags === null) return null;
  const out: AdminFlagOverrides = {};
  for (const id of MODULE_IDS) {
    if (id in moduleFlags && typeof (moduleFlags as Record<string, unknown>)[id] === 'boolean') {
      out[id] = (moduleFlags as Record<string, boolean>)[id];
    }
  }
  return out;
}

export async function POST(request: NextRequest) {
  const allowed = await isAdminUser();
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!isPreProdContext()) {
    return NextResponse.json(
      { error: 'Flag overrides are only available in pre-production' },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const overrides = parseBody(body);
  if (overrides === null) {
    return NextResponse.json(
      { error: 'Body must include moduleFlags (object)' },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ success: true });
  if (Object.keys(overrides).length === 0) {
    response.cookies.set(ADMIN_FLAG_OVERRIDE_COOKIE, '', { path: '/', maxAge: 0 });
    return response;
  }

  const value = encodeURIComponent(JSON.stringify(overrides));
  response.cookies.set(ADMIN_FLAG_OVERRIDE_COOKIE, value, {
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  });
  return response;
}
