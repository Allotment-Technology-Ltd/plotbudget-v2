import { NextRequest, NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';

// Polar SDK checkout: supports fixed pricing (monthly/annual) and PWYL (custom amounts)
// Query params:
//   - product=monthly|annual|pwyl
//   - amount=X.XX (for PWYL, £0-£10)
//   - household_id (required for metadata)
//   - user_id (optional for metadata)
// Env required: POLAR_ACCESS_TOKEN, POLAR_SUCCESS_URL, product IDs

interface CheckoutConfig {
  mode: 'fixed' | 'pwyl_free' | 'pwyl_custom';
  productId?: string;
  amount?: number;
}

function resolveCheckoutConfig(req: NextRequest): CheckoutConfig {
  const productParam = req.nextUrl.searchParams.get('product');
  
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
  const config = resolveCheckoutConfig(req);

  // Validate required config
  if (!config.productId) {
    return NextResponse.json({
      error: 'Missing Polar product ID. Set POLAR_PREMIUM_PRODUCT_ID (fixed) or POLAR_PWYL_BASE_PRODUCT_ID (PWYL).',
    }, { status: 400 });
  }
  
  if (!process.env.POLAR_ACCESS_TOKEN || !process.env.POLAR_SUCCESS_URL) {
    return NextResponse.json({ 
      error: 'Missing POLAR_ACCESS_TOKEN or POLAR_SUCCESS_URL' 
    }, { status: 500 });
  }
  
  const householdId = req.nextUrl.searchParams.get('household_id') ?? undefined;
  const userId = req.nextUrl.searchParams.get('user_id') ?? undefined;
  
  try {
    const polar = new Polar({ 
      accessToken: process.env.POLAR_ACCESS_TOKEN!,
      server: 'sandbox' as any,
    });
    const checkout = await polar.checkouts.create({
      products: [config.productId!],
      successUrl: process.env.POLAR_SUCCESS_URL!,
      metadata: {
        ...(householdId ? { household_id: householdId } : {}),
        ...(userId ? { user_id: userId } : {}),
        pricing_mode: config.mode === 'pwyl_custom' ? 'pwyl' : 'fixed',
      },
    });
    
    if (checkout?.url) {
      return NextResponse.redirect(checkout.url, 302);
    }

    return NextResponse.json(
      { error: 'Checkout created without URL' },
      { status: 500 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Polar checkout creation failed' },
      { status: 500 }
    );
  }
};
