/**
 * Public API: roadmap features for marketing site and app.
 * Returns features ordered by status and display_order.
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
      .from('roadmap_features')
      .select('id, title, description, module_key, icon_name, status, display_order, key_features, estimated_timeline')
      .order('status', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) {
      console.error('roadmap API:', error);
      return NextResponse.json(
        { error: 'Unable to fetch roadmap' },
        { status: 500, headers }
      );
    }

    return NextResponse.json({ features: data ?? [] }, { headers });
  } catch (e) {
    console.error('roadmap API:', e);
    return NextResponse.json(
      { error: 'Unable to fetch roadmap' },
      { status: 500, headers }
    );
  }
}
