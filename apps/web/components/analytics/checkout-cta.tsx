'use client';

import { useRouter } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';

/** Allowed checkout paths (same-origin only). Used to avoid open redirect / XSS. */
const ALLOWED_CHECKOUT_PREFIX = '/api/checkout';

interface CheckoutCtaProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  /** PWYL amount in GBP (e.g. 3 for £3). Omit for non-PWYL. */
  amount?: number;
  /** e.g. 'pwyl' | 'fixed' */
  pricingMode?: string;
}

/**
 * Link/button that captures checkout_started before navigating to checkout.
 * Use for pricing CTAs that go to /api/checkout.
 */
export function CheckoutCta({ href, children, className, amount, pricingMode }: CheckoutCtaProps) {
  const router = useRouter();
  const posthog = usePostHog();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const safePath =
      href.startsWith(ALLOWED_CHECKOUT_PREFIX) && !href.includes('\\')
        ? href
        : `${ALLOWED_CHECKOUT_PREFIX}?product=pwyl`;
    try {
      if (posthog?.capture) {
        posthog.capture('checkout_started', {
          amount: amount ?? undefined,
          pricing_mode: pricingMode ?? 'pwyl',
        });
      }
    } catch {
      // Don't block navigation
    }
    router.push(safePath);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
