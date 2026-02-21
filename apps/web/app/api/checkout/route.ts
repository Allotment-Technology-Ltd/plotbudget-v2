import { NextRequest, NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPlotTrialEndDate } from '@/lib/utils/trial-end-date';
import { differenceInDays } from 'date-fns';

// Polar SDK checkout: supports fixed pricing (monthly/annual) and PWYL (custom amounts).
// Requires authenticated session — household_id and user_id are resolved server-side
// to prevent IDOR (arbitrary household association).
//
// PWYL products are auto-routed by household currency:
//   - GBP household → POLAR_PWYL_GBP_PRODUCT_ID
//   - USD household → POLAR_PWYL_USD_PRODUCT_ID
//   - EUR household → POLAR_PWYL_EUR_PRODUCT_ID
//   - Fallback: GBP or legacy POLAR_PWYL_BASE_PRODUCT_ID
//
// Query params:
//   - product=monthly|annual|pwyl (default: monthly)
// Env required: POLAR_ACCESS_TOKEN, currency-specific product IDs
// Env optional: POLAR_SUCCESS_URL (default: {requestOrigin}/dashboard?checkout_id={CHECKOUT_ID})
//              POLAR_SANDBOX=true (use sandbox API; omit or false for production)

interface CheckoutConfig {
  mode: 'fixed' | 'pwyl_free' | 'pwyl_custom';
  productId?: string;
  amount?: number;
}

type Currency = 'GBP' | 'USD' | 'EUR';

/**
 * Resolve PWYL product ID by household currency.
 * Falls back to GBP if currency is null/unknown or env var is missing.
 * Maintains backward compatibility with legacy POLAR_PWYL_BASE_PRODUCT_ID.
 */
function resolvePWYLProductByCurrency(currency: Currency | null | undefined): string | undefined {
  const currencyMap: Record<Currency, string | undefined> = {
    GBP: process.env.POLAR_PWYL_GBP_PRODUCT_ID,
    USD: process.env.POLAR_PWYL_USD_PRODUCT_ID,
    EUR: process.env.POLAR_PWYL_EUR_PRODUCT_ID,
  };

  // If currency is valid and we have a currency-specific product, use it
  if (currency && currency in currencyMap && currencyMap[currency]) {
    return currencyMap[currency];
  }

  // Fallback 1: Try GBP product
  if (currencyMap.GBP) {
    return currencyMap.GBP;
  }

  // Fallback 2: Legacy POLAR_PWYL_BASE_PRODUCT_ID (for backward compatibility)
  return process.env.POLAR_PWYL_BASE_PRODUCT_ID;
}

function resolveCheckoutConfig(
  productParam: string | null,
  householdCurrency: Currency | null | undefined
): CheckoutConfig {
  // PWYL mode - Polar's native PWYL handles amount selection
  // Product ID is now resolved by household currency
  if (productParam === 'pwyl') {
    return {
      mode: 'pwyl_custom',
      productId: resolvePWYLProductByCurrency(householdCurrency),
    };
  }

  // Fixed pricing mode (legacy)
  const monthlyProduct = process.env.POLAR_PREMIUM_PRODUCT_ID;
  const annualProduct = process.env.POLAR_PREMIUM_ANNUAL_PRODUCT_ID;

  return {
    mode: 'fixed',
    productId: productParam === 'annual' ? annualProduct : monthlyProduct,
  };
}

export const GET = async (req: NextRequest) => {
  // --- Auth: resolve user and household server-side ---
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirect unauthenticated users to login (with return path)
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl.toString(), 302);
  }

  // Resolve household_id and currency from the authenticated user (owner or partner)
  const { data: ownedHousehold } = await supabase
    .from('households')
    .select('id, currency, pay_cycle_type, pay_day')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: partnerHousehold } = await supabase
    .from('households')
    .select('id, currency, pay_cycle_type, pay_day')
    .eq('partner_user_id', user.id)
    .order('partner_accepted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  type HouseholdData = {
    id: string;
    currency: Currency | null;
    pay_cycle_type: 'specific_date' | 'last_working_day' | 'every_4_weeks';
    pay_day: number | null;
  } | null;
  const household = (ownedHousehold as HouseholdData) ?? (partnerHousehold as HouseholdData);

  if (!household?.id) {
    return NextResponse.json(
      { error: 'No household found for this user. Complete onboarding first.' },
      { status: 400 },
    );
  }

  const householdId = household.id;
  const householdCurrency = household.currency;

  // Fetch user profile (display name, trial state for deferring first payment)
  const { data: profile } = await supabase
    .from('users')
    .select('display_name, trial_cycles_completed, trial_ended_at')
    .eq('id', user.id)
    .maybeSingle();

  // --- Checkout config ---
  const productParam = req.nextUrl.searchParams.get('product');
  const config = resolveCheckoutConfig(productParam, householdCurrency);

  if (!config.productId) {
    return NextResponse.json({
      error: 'Missing Polar product ID. Set currency-specific env vars (POLAR_PWYL_GBP_PRODUCT_ID, etc.) or legacy POLAR_PWYL_BASE_PRODUCT_ID.',
    }, { status: 400 });
  }

  if (!process.env.POLAR_ACCESS_TOKEN) {
    return NextResponse.json({
      error: 'Missing POLAR_ACCESS_TOKEN',
    }, { status: 500 });
  }

  // Success URL: use POLAR_SUCCESS_URL if set, else derive from request origin.
  // This ensures local → localhost redirect, prod → app URL redirect (no env switching).
  const successUrl =
    process.env.POLAR_SUCCESS_URL ||
    `${req.nextUrl.origin}/dashboard?checkout_id={CHECKOUT_ID}`;

  try {
    const polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN!,
      ...(process.env.POLAR_SANDBOX === 'true' ? { server: 'sandbox' as const } : {}),
    });

    // Only pass email if it's not a test/reserved domain (.test, .local, .localhost, .invalid)
    // Polar API rejects these as invalid email addresses
    const isValidEmail = user.email && !/(\.test|\.local|\.localhost|\.invalid)$/i.test(user.email);
    const profileRow = profile as {
      display_name?: string | null;
      trial_cycles_completed?: number;
      trial_ended_at?: string | null;
    } | null;
    const displayName = profileRow?.display_name ?? undefined;
    const trialCyclesCompleted = profileRow?.trial_cycles_completed ?? 0;
    const trialEndedAt = profileRow?.trial_ended_at ?? null;

    // If user upgrades during trial, defer first payment until PLOT trial would end
    let trialParams: { trial_interval: 'day'; trial_interval_count: number } | undefined;
    let upgradedDuringTrialMetadata: Record<string, string> = {};

    const isInTrial = trialCyclesCompleted < 2 && !trialEndedAt;
    if (isInTrial) {
      const { data: activeCycle } = await supabase
        .from('paycycles')
        .select('end_date')
        .eq('household_id', householdId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      const cycleRow = activeCycle as { end_date: string } | null;
      if (cycleRow) {
        const trialEndDate = getPlotTrialEndDate(
          trialCyclesCompleted,
          cycleRow.end_date,
          household?.pay_cycle_type ?? 'specific_date',
          household?.pay_day ?? null
        );
        if (trialEndDate) {
          const trialEnd = new Date(trialEndDate);
          trialEnd.setHours(23, 59, 59, 999);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const daysUntilTrialEnd = differenceInDays(trialEnd, today);
          if (daysUntilTrialEnd > 0) {
            trialParams = { trial_interval: 'day', trial_interval_count: Math.min(daysUntilTrialEnd, 1000) };
            upgradedDuringTrialMetadata = {
              upgraded_during_trial: 'true',
              plot_trial_end_date: trialEndDate,
            };
          }
        }
      }
    }

    const checkout = await polar.checkouts.create({
      products: [config.productId!],
      successUrl,
      ...(isValidEmail ? { customer_email: user.email } : {}),
      ...(displayName ? { customer_name: displayName } : {}),
      ...(trialParams ? trialParams : {}),
      metadata: {
        household_id: householdId,
        user_id: user.id,
        pricing_mode: config.mode === 'pwyl_custom' ? 'pwyl' : 'fixed',
        ...upgradedDuringTrialMetadata,
      },
    });

    if (checkout?.url) {
      return NextResponse.redirect(checkout.url, 302);
    }

    console.error('Checkout created without URL', { checkout });
    return NextResponse.json(
      { error: 'Checkout created without URL' },
      { status: 500 },
    );
  } catch (error) {
    console.error('Polar checkout creation failed:', error, {
      mode: config.mode,
      productId: config.productId,
      householdId,
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Polar checkout creation failed' },
      { status: 500 },
    );
  }
};
