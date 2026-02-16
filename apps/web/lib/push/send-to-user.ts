/**
 * Send a push notification to all devices of a user (by user id).
 * Uses admin client to read push_tokens. Use from API routes or cron.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { getPushTokensForUser } from './get-tokens-for-user';
import { buildExpoMessage, sendExpoPush } from './send-expo-push';

import type { PushNotificationType } from './get-tokens-for-user';

export type SendPushToUserOptions = {
  title: string;
  body: string;
  /** Optional data payload (e.g. path for deep link). */
  data?: Record<string, unknown>;
  /** Only send to tokens that have this notification type enabled. */
  type?: PushNotificationType;
};

/**
 * Send push to all tokens registered for the given user (filtered by type if provided). No-op if user has no tokens.
 */
export async function sendPushToUser(
  userId: string,
  options: SendPushToUserOptions
): Promise<{ sent: number; error?: string }> {
  const supabase = createAdminClient();
  const tokens = await getPushTokensForUser(supabase, userId, options.type ? { type: options.type } : undefined);
  if (tokens.length === 0) return { sent: 0 };

  const message = buildExpoMessage(tokens, {
    title: options.title,
    body: options.body,
    data: options.data,
  });

  try {
    const response = await sendExpoPush([message]);
    const tickets = response.data ?? [];
    const okCount = tickets.filter((t) => t.status === 'ok').length;
    return { sent: okCount };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { sent: 0, error: msg };
  }
}
