/**
 * Public API: founding member spots left for marketing site countdown.
 * Only intended for consumption by the marketing site (plotbudget.com).
 *
 * Returns spotsLeft (0–100) and showCountdown: true only when at least 17
 * households have founder status (founding_member_until set).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const FOUNDING_LIMIT = 100;
const SHOW_COUNTDOWN_MIN_FOUNDER_HOUSEHOLDS = 17;

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

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('households')
      .select('id')
      .not('founding_member_until', 'is', null);

    if (error) {
      console.error('founding-spots: count error', error);
      return NextResponse.json(
        { error: 'Unable to fetch spots' },
        { status: 500, headers }
      );
    }

    const founderHouseholdCount = (data ?? []).length;
    const spotsLeft = Math.max(0, FOUNDING_LIMIT - founderHouseholdCount);
    const showCountdown =
      founderHouseholdCount >= SHOW_COUNTDOWN_MIN_FOUNDER_HOUSEHOLDS;

    return NextResponse.json(
      { spotsLeft, limit: FOUNDING_LIMIT, showCountdown },
      { headers }
    );
  } catch (e) {
    console.error('founding-spots:', e);
    return NextResponse.json(
      { error: 'Unable to fetch spots' },
      { status: 500, headers }
    );
  }
}
