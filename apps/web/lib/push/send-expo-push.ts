/**
 * Send push notifications via Expo Push API.
 * https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export type ExpoPushMessage = {
  to: string | string[];
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
};

export type ExpoPushTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};

export type ExpoPushResponse = {
  data?: ExpoPushTicket[];
  errors?: { code: string; message: string }[];
};

/**
 * Send one or more messages to Expo Push API. Messages must be for the same project.
 * Returns response with push tickets (or errors). Does not retry.
 */
export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<ExpoPushResponse> {
  if (messages.length === 0) return {};
  if (messages.length > 100) {
    throw new Error('Expo Push API accepts at most 100 messages per request');
  }

  const body = messages.length === 1 ? messages[0] : messages;
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as ExpoPushResponse;
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.message ?? `Expo Push API returned ${res.status}`);
  }
  return json;
}

/**
 * Build a single message for a list of tokens (same title/body/data for all).
 */
export function buildExpoMessage(
  tokens: string[],
  options: { title?: string; body?: string; data?: Record<string, unknown> }
): ExpoPushMessage {
  const to = tokens.length === 1 ? tokens[0]! : tokens;
  return {
    to,
    title: options.title,
    body: options.body,
    data: options.data,
    sound: 'default',
  };
}
