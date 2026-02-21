'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const PAYDAY_COMPLETE_PATH = '/dashboard/payday-complete';
const REDIRECT_PATHS = ['/dashboard', '/dashboard/money', '/dashboard/money/blueprint'];

export function PaydayCompleteRedirect({
  shouldRedirectToPaydayComplete,
}: {
  shouldRedirectToPaydayComplete: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!shouldRedirectToPaydayComplete) return;
    if (pathname === PAYDAY_COMPLETE_PATH) return;
    if (!REDIRECT_PATHS.includes(pathname)) return;
    router.replace(PAYDAY_COMPLETE_PATH);
  }, [shouldRedirectToPaydayComplete, pathname, router]);

  return null;
}
