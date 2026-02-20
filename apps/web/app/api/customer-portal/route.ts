import { NextRequest, NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Authenticated route that creates a Polar customer portal session and redirects.
// Users can manage their subscription (change amount, cancel, update payment method)
// via Polar's hosted customer portal.
//
// Requires: POLAR_ACCESS_TOKEN
// Optional: POLAR_SANDBOX=true (use sandbox API; omit or false for production)

export const GET = async (req: NextRequest) => {
  // --- Auth ---
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('redirect', '/dashboard/settings?tab=subscription');
    return NextResponse.redirect(loginUrl.toString(), 302);
  }

  // --- Get polar_customer_id from user profile ---
  const { data: profile } = await supabase
    .from('users')
    .select('polar_customer_id')
    .eq('id', user.id)
    .single();

  const polarCustomerId = (profile as { polar_customer_id: string | null } | null)?.polar_customer_id;

  if (!polarCustomerId) {
    // User has no Polar customer ID — they haven't subscribed yet.
    // Redirect to pricing page instead.
    return NextResponse.redirect(new URL('/pricing', req.nextUrl.origin).toString(), 302);
  }

  if (!process.env.POLAR_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: 'Missing POLAR_ACCESS_TOKEN' },
      { status: 500 },
    );
  }

  const returnUrl = new URL('/dashboard/settings?tab=subscription', req.nextUrl.origin).toString();

  try {
    const polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN!,
      ...(process.env.POLAR_SANDBOX === 'true' ? { server: 'sandbox' as const } : {}),
    });

    const session = await polar.customerSessions.create({
      customerId: polarCustomerId,
      returnUrl,
    });

    if (session?.customerPortalUrl) {
      return NextResponse.redirect(session.customerPortalUrl, 302);
    }

    // Fallback: redirect to settings with error indication
    console.error('Customer portal session created but no URL returned', { session });
    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=subscription&portal_error=true', req.nextUrl.origin).toString(),
      302,
    );
  } catch (error) {
    // If session creation fails, redirect back to settings
    console.error('Customer portal session creation failed:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=subscription&portal_error=true', req.nextUrl.origin).toString(),
      302,
    );
  }
};
