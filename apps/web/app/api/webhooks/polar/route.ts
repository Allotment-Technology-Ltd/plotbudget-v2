import { NextRequest, NextResponse } from 'next/server';
import { validateEvent } from '@polar-sh/sdk/webhooks';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';

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
  };
};

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

export async function POST(req: NextRequest) {
  if (!process.env.POLAR_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing POLAR_WEBHOOK_SECRET' }, { status: 500 });
  }

  const rawBody = await req.text();

  let event: PolarSubscriptionEvent;
  try {
    const headersObj = Object.fromEntries(req.headers.entries());
    event = validateEvent(rawBody, headersObj, process.env.POLAR_WEBHOOK_SECRET) as PolarSubscriptionEvent;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const { type, data } = event;
  if (type !== 'subscription.created' && type !== 'subscription.updated') {
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();
  const householdId = data.metadata?.household_id ?? null;
  const userId = data.metadata?.user_id ?? null;
  const pwylAmount = data.metadata?.pwyl_amount ?? null;
  const pricingMode = data.metadata?.pricing_mode ?? null;
  const tier = mapTier(data.product_id, data.price_id, data.metadata);

  if (!householdId) {
    return NextResponse.json({ error: 'Missing household_id metadata' }, { status: 400 });
  }

  const payload: Database['public']['Tables']['subscriptions']['Insert'] = {
    polar_subscription_id: data.id,
    household_id: householdId,
    status: (data.status as Database['public']['Enums']['subscription_status']) ?? 'active',
    current_tier: tier ?? null,
    trial_end_date: data.trial_ends_at ?? null,
    polar_product_id: data.product_id ?? data.price_id ?? null,
  };
  
  // Add PWYL amount to metadata if present
  if (pwylAmount || pricingMode) {
    (payload as any).metadata = {
      ...(pwylAmount ? { pwyl_amount: pwylAmount } : {}),
      ...(pricingMode ? { pricing_mode: pricingMode } : {}),
    };
  }

  const { error } = await (supabase as any)
    .from('subscriptions')
    .upsert(payload, { onConflict: 'polar_subscription_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Optionally update user subscription fields for quick reads
  if (userId && tier === 'pro') {
    const normalizedUserStatus: Database['public']['Tables']['users']['Update']['subscription_status'] =
      data.status === 'trialing'
        ? 'active'
        : (['active', 'cancelled', 'past_due'].includes(data.status) ? data.status : null) as Database['public']['Tables']['users']['Update']['subscription_status'];

    await (supabase as any)
      .from('users')
      .update({
        subscription_tier: 'pro',
        subscription_status: normalizedUserStatus,
        polar_customer_id: data.customer_id ?? null,
      })
      .eq('id', userId);
  }

  return NextResponse.json({ received: true });
}
