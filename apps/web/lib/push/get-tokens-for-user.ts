/**
 * Fetch Expo push tokens for a user. Requires admin client (RLS allows only own tokens for anon).
 * When type is provided, only returns tokens that have that notification type enabled.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/supabase';

export type PushNotificationType = 'payday' | 'partner' | 'bills_marked_paid';

const TYPE_COLUMN: Record<PushNotificationType, keyof Database['public']['Tables']['push_tokens']['Row']> = {
  payday: 'payday_reminders',
  partner: 'partner_activity',
  bills_marked_paid: 'bills_marked_paid',
};

export async function getPushTokensForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  options?: { type?: PushNotificationType }
): Promise<string[]> {
  let query = supabase.from('push_tokens').select('token').eq('user_id', userId);

  if (options?.type) {
    const col = TYPE_COLUMN[options.type];
    query = query.eq(col, true);
  }

  const { data, error } = await query;
  if (error) return [];
  const rows = (data ?? []) as { token: string }[];
  return rows.map((r) => r.token);
}
