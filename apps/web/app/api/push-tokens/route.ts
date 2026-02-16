import { NextRequest, NextResponse } from 'next/server';
import type { InsertTables } from '@repo/supabase';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';

const PLATFORMS = ['ios', 'android'] as const;

/**
 * POST /api/push-tokens
 * Register or refresh an Expo push token for the current user (native app, Bearer token).
 * Body: { token: string, platform: 'ios' | 'android', paydayReminders?: boolean, partnerActivity?: boolean, billsMarkedPaid?: boolean }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    token?: string;
    platform?: string;
    paydayReminders?: boolean;
    partnerActivity?: boolean;
    billsMarkedPaid?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const pushToken = body.token;
  const platform = body.platform;

  if (!pushToken || typeof pushToken !== 'string' || !pushToken.trim()) {
    return NextResponse.json(
      { error: 'Missing or invalid token' },
      { status: 400 }
    );
  }

  if (!platform || !PLATFORMS.includes(platform as (typeof PLATFORMS)[number])) {
    return NextResponse.json(
      { error: 'Invalid platform. Must be ios or android' },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClientFromToken(token);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const row: InsertTables<'push_tokens'> = {
    user_id: user.id,
    token: pushToken.trim(),
    platform: platform as 'ios' | 'android',
  };
  if (typeof body.paydayReminders === 'boolean') row.payday_reminders = body.paydayReminders;
  if (typeof body.partnerActivity === 'boolean') row.partner_activity = body.partnerActivity;
  if (typeof body.billsMarkedPaid === 'boolean') row.bills_marked_paid = body.billsMarkedPaid;

  // @ts-expect-error - Supabase generated client can infer push_tokens as never; row is InsertTables<'push_tokens'>
  const { error } = await supabase.from('push_tokens').upsert(row, {
    onConflict: 'user_id,token',
  });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to register token' },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/push-tokens
 * Remove all push tokens for the current user (e.g. when user disables notifications in app).
 */
export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseClientFromToken(token);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase.from('push_tokens').delete().eq('user_id', user.id);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to remove tokens' },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
