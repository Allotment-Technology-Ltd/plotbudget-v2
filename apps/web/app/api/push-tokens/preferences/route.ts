import { NextRequest, NextResponse } from 'next/server';
import type { UpdateTables } from '@repo/supabase';
import { createSupabaseClientFromToken } from '@/lib/supabase/client-from-token';

/**
 * PATCH /api/push-tokens/preferences
 * Update push notification preferences for all tokens of the current user.
 * Body: { paydayReminders?: boolean, partnerActivity?: boolean, billsMarkedPaid?: boolean }
 */
export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    paydayReminders?: boolean;
    partnerActivity?: boolean;
    billsMarkedPaid?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates: UpdateTables<'push_tokens'> = {};
  if (typeof body.paydayReminders === 'boolean') updates.payday_reminders = body.paydayReminders;
  if (typeof body.partnerActivity === 'boolean') updates.partner_activity = body.partnerActivity;
  if (typeof body.billsMarkedPaid === 'boolean') updates.bills_marked_paid = body.billsMarkedPaid;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true });
  }

  const supabase = createSupabaseClientFromToken(token);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // @ts-expect-error - Supabase generated client can infer push_tokens as never; updates is UpdateTables<'push_tokens'>
  const { error } = await supabase.from('push_tokens').update(updates).eq('user_id', user.id);

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to update preferences' },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
