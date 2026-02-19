/**
 * Public API: changelog entries for What's new.
 * Consumable by the app and marketing site (plotbudget.com).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ALLOWED_ORIGINS = [
  'https://plotbudget.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

function corsHeaders(origin: string | null): HeadersInit {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(null),
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('changelog_entries')
      .select('id, version, released_at, content, display_order')
      .order('display_order', { ascending: true })
      .order('released_at', { ascending: false });

    if (error) {
      console.error('changelog API:', error);
      return NextResponse.json(
        { error: 'Unable to fetch changelog' },
        { status: 500, headers }
      );
    }

    return NextResponse.json({ entries: data ?? [] }, { headers });
  } catch (e) {
    console.error('changelog API:', e);
    return NextResponse.json(
      { error: 'Unable to fetch changelog' },
      { status: 500, headers }
    );
  }
}
