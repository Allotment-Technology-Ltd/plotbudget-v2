import { NextRequest, NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Polar SDK checkout: supports fixed pricing (monthly/annual) and PWYL (custom amounts).
// Requires authenticated session — household_id and user_id are resolved server-side
// to prevent IDOR (arbitrary household association).
//
// Query params:
//   - product=monthly|annual|pwyl
// Env required: POLAR_ACCESS_TOKEN, product IDs
// Env optional: POLAR_SUCCESS_URL (default: {requestOrigin}/dashboard?checkout_id={CHECKOUT_ID})
//              POLAR_SANDBOX=true (use sandbox API; omit or false for production)

interface CheckoutConfig {
  mode: 'fixed' | 'pwyl_free' | 'pwyl_custom';
  productId?: string;
  amount?: number;
}

function resolveCheckoutConfig(productParam: string | null): CheckoutConfig {
  // PWYL mode - Polar's native PWYL handles amount selection
  if (productParam === 'pwyl') {
    return {
      mode: 'pwyl_custom',
      productId: process.env.POLAR_PWYL_BASE_PRODUCT_ID,
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

  // Resolve household_id from the authenticated user (owner or partner)
  const { data: ownedHousehold } = await supabase
    .from('households')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  const { data: partnerHousehold } = await supabase
    .from('households')
    .select('id')
    .eq('partner_user_id', user.id)
    .maybeSingle();

  const householdId = (ownedHousehold as { id: string } | null)?.id ?? (partnerHousehold as { id: string } | null)?.id;

  if (!householdId) {
    return NextResponse.json(
      { error: 'No household found for this user. Complete onboarding first.' },
      { status: 400 },
    );
  }

  // Fetch user profile to get display name (pre-fill checkout form)
  const { data: profile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle();

  // --- Checkout config ---
  const productParam = req.nextUrl.searchParams.get('product');
  const config = resolveCheckoutConfig(productParam);

  if (!config.productId) {
    return NextResponse.json({
      error: 'Missing Polar product ID. Set POLAR_PREMIUM_PRODUCT_ID (fixed) or POLAR_PWYL_BASE_PRODUCT_ID (PWYL).',
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
      ...(process.env.POLAR_SANDBOX === 'true' ? { server: 'sandbox' as any } : {}),
    });

    // Only pass email if it's not a test/reserved domain (.test, .local, .localhost, .invalid)
    // Polar API rejects these as invalid email addresses
    const isValidEmail = user.email && !/(\.test|\.local|\.localhost|\.invalid)$/i.test(user.email);
    const displayName = (profile as { display_name?: string | null } | null)?.display_name ?? undefined;

    const checkout = await polar.checkouts.create({
      products: [config.productId!],
      successUrl,
      ...(isValidEmail ? { customer_email: user.email } : {}),
      ...(displayName ? { customer_name: displayName } : {}),
      metadata: {
        household_id: householdId,
        user_id: user.id,
        pricing_mode: config.mode === 'pwyl_custom' ? 'pwyl' : 'fixed',
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
