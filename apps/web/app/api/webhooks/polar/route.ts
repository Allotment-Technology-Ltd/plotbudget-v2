import { NextRequest, NextResponse } from 'next/server';
import { validateEvent } from '@polar-sh/sdk/webhooks';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@repo/supabase';

// Webhook handler for Polar subscription events
// Env required: POLAR_WEBHOOK_SECRET, POLAR_PREMIUM_PRODUCT_ID / POLAR_PREMIUM_PRICE_ID (monthly), POLAR_PREMIUM_ANNUAL_PRODUCT_ID (optional)

type PolarSubscriptionEvent = {
  type: string;
  data: {
    id: string; // polar_subscription_id
    status: string;
    product_id?: string;
    price_id?: string;
    customer_id?: string;
    metadata?: Record<string, string | null>;
    trial_ends_at?: string | null;
    // Newer Polar events nest product as an object
    product?: { id: string; name?: string } | null;
    customer?: { id: string } | null;
  };
};

// Polar sends "canceled" (US); our DB enum uses "cancelled" (UK).
// Polar also sends incomplete, incomplete_expired, unpaid - map to our enum values.
function normalizeStatus(
  polarStatus: string
): Database['public']['Enums']['subscription_status'] {
  const map: Record<string, Database['public']['Enums']['subscription_status']> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'cancelled',
    cancelled: 'cancelled',
    incomplete: 'past_due',
    incomplete_expired: 'past_due',
    unpaid: 'past_due',
  };
  return map[polarStatus] ?? 'active';
}

function mapTier(productId?: string, priceId?: string, metadata?: Record<string, string | null>): 'pro' | null {
  // PWYL subscriptions
  const pwylProduct = process.env.POLAR_PWYL_BASE_PRODUCT_ID;
  if (productId === pwylProduct || metadata?.pricing_mode === 'pwyl') return 'pro';
  if (productId === 'pwyl_free') return 'pro'; // £0 local subscriptions
  
  // Fixed pricing subscriptions (legacy)
  const monthly = process.env.POLAR_PREMIUM_PRODUCT_ID ?? process.env.POLAR_PREMIUM_PRICE_ID;
  const annual = process.env.POLAR_PREMIUM_ANNUAL_PRODUCT_ID;
  if (!productId && priceId) productId = priceId;
  if (productId && annual && productId === annual) return 'pro';
  if (productId && monthly && productId === monthly) return 'pro';
  
  return null;
}

// All subscription lifecycle events we process
const SUBSCRIPTION_EVENTS = new Set([
  'subscription.created',
  'subscription.updated',
  'subscription.active',
  'subscription.canceled',
  'subscription.revoked',
  'subscription.uncanceled',
]);

// Event types we acknowledge but don't process (checkout.*, member.*, etc.)
// Returning 200 prevents Polar from retrying and causing 502s.
function isUnhandledEventType(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    msg.includes('unknown event type') ||
    msg.includes('unknown event') ||
    msg.includes('unrecognized event') ||
    msg.includes('checkout.') ||
    msg.includes('member.')
  );
}

export async function POST(req: NextRequest) {
  // Visible in dev terminal: search for "webhook/polar"
  console.log('[webhook/polar] POST received');
  try {
    if (!process.env.POLAR_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Missing POLAR_WEBHOOK_SECRET' }, { status: 500 });
    }

    const rawBody = await req.text();

    let event: PolarSubscriptionEvent;
    try {
      const headersObj = Object.fromEntries(req.headers.entries());
      event = validateEvent(rawBody, headersObj, process.env.POLAR_WEBHOOK_SECRET) as PolarSubscriptionEvent;
    } catch (error) {
      // Polar SDK throws for event types it doesn't recognise (e.g. checkout.expired).
      // Return 200 so Polar won't retry; 502s occur when we fail to respond at all.
      if (isUnhandledEventType(error)) {
        return NextResponse.json({ received: true });
      }
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const { type, data } = event;

    // Acknowledge non-subscription events (checkout.*, customer.*, etc.)
    if (!SUBSCRIPTION_EVENTS.has(type)) {
      return NextResponse.json({ received: true });
    }

    const supabase = createAdminClient();
    let householdId = data.metadata?.household_id ?? null;
    const userId = data.metadata?.user_id ?? null;
    // Resolve product_id / customer_id from flat or nested shapes
    const productId = data.product_id ?? data.product?.id ?? undefined;
    const customerId = data.customer_id ?? data.customer?.id ?? undefined;
    const tier = mapTier(productId, data.price_id, data.metadata);

    // If metadata is empty (common for lifecycle events like subscription.canceled),
    // try to look up the existing subscription record by polar_subscription_id.
    if (!householdId) {
      const { data: existing } = await (supabase as any)
        .from('subscriptions')
        .select('household_id')
        .eq('polar_subscription_id', data.id)
        .maybeSingle();
      if (existing?.household_id) {
        householdId = existing.household_id;
      }
    }

    if (!householdId) {
      // Return 200 to acknowledge — retrying won't help since metadata is absent
      return NextResponse.json({ received: true, note: 'no household_id available' });
    }

    const metadata: Record<string, string | null> | null = data.metadata
      ? {
          pwyl_amount: data.metadata.pwyl_amount ?? null,
          pricing_mode: data.metadata.pricing_mode ?? null,
          upgraded_during_trial: data.metadata.upgraded_during_trial ?? null,
          plot_trial_end_date: data.metadata.plot_trial_end_date ?? null,
        }
      : null;

    const payload: Database['public']['Tables']['subscriptions']['Insert'] = {
      polar_subscription_id: data.id,
      household_id: householdId,
      status: normalizeStatus(data.status),
      current_tier: tier ?? null,
      trial_end_date: data.trial_ends_at ?? null,
      polar_product_id: productId ?? data.price_id ?? null,
      metadata: metadata ?? undefined,
    };

    const { error } = await (supabase as any)
      .from('subscriptions')
      .upsert(payload, { onConflict: 'polar_subscription_id' });

    if (error) {
      console.error('Webhook upsert failed:', error, { householdId, polarSubId: data.id });
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }

    console.log('[webhook/polar] Processed', type, { householdId, polarSubId: data.id });

    // Update user subscription fields for quick reads
    if (userId && tier === 'pro') {
      const dbStatus = normalizeStatus(data.status);
      const normalizedUserStatus: Database['public']['Tables']['users']['Update']['subscription_status'] =
        dbStatus === 'trialing' ? 'active' : (['active', 'cancelled', 'past_due'].includes(dbStatus) ? dbStatus : null) as Database['public']['Tables']['users']['Update']['subscription_status'];

      const userUpdate: Database['public']['Tables']['users']['Update'] = {
        subscription_tier: 'pro',
        subscription_status: normalizedUserStatus,
        polar_customer_id: customerId ?? null,
      };

      // User upgraded during PLOT trial: mark trial as ended so we don't send trial-ended emails,
      // and so billing starts when Polar's trial ends (first cycle after PLOT trial).
      const upgradedDuringTrial = data.metadata?.upgraded_during_trial === 'true';
      const plotTrialEndDate = data.metadata?.plot_trial_end_date ?? null;
      if (upgradedDuringTrial && plotTrialEndDate) {
        userUpdate.trial_cycles_completed = 2;
        userUpdate.trial_ended_at = plotTrialEndDate;
        userUpdate.trial_ended_email_sent = true;
      }

      await (supabase as any)
        .from('users')
        .update(userUpdate)
        .eq('id', userId);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[webhook/polar] Unhandled error:', err);
    // Return 200 to stop Polar retries; 502s occur when we fail to respond at all.
    return NextResponse.json({ received: true });
  }
}
