/**
 * Server-side PostHog client for capturing events from API routes and server actions.
 * Use the same project key as the client (NEXT_PUBLIC_POSTHOG_KEY) so events
 * are attributed to the same project; set distinctId to the user or household ID
 * to align with client-side identify().
 */
import { PostHog } from 'posthog-node';

let client: PostHog | null = null;

function getPostHogClient(): PostHog | null {
  if (typeof process === 'undefined') return null;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com';
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, { host });
  }
  return client;
}

export interface ServerCaptureOptions {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
}

/**
 * Capture an event from the server. Use when the action happens in a webhook
 * or server action (e.g. subscription_started, partner_invite_sent).
 * distinctId should match the client-side identify() (user id) when possible.
 */
export function captureServerEvent(options: ServerCaptureOptions): void {
  const ph = getPostHogClient();
  if (!ph) return;
  try {
    ph.capture({
      distinctId: options.distinctId,
      event: options.event,
      properties: options.properties ?? {},
    });
    ph.flush();
  } catch (e) {
    console.error('[posthog-server] capture failed:', e);
  }
}
