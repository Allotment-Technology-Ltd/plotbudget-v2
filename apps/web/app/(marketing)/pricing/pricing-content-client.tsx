'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PricingMatrix } from '@/components/pricing/pricing-matrix';
import { PWYLPricingMatrix } from '@/components/pricing/pricing-matrix-pwyl';

type PricingContentClientProps = {
  showPWYL: boolean;
  fullPremiumVisible: boolean;
};

export function PricingContentClient({ showPWYL, fullPremiumVisible }: PricingContentClientProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  if (showPWYL) {
    return <PWYLPricingMatrix isLoggedIn={isLoggedIn} />;
  }
  return <PricingMatrix pricingEnabled={fullPremiumVisible} isLoggedIn={isLoggedIn} />;
}
