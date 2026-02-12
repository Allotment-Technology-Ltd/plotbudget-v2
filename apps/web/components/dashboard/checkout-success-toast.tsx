'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function CheckoutSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutId = searchParams?.get('checkout_id');

  useEffect(() => {
    if (!checkoutId) return;

    // Show success toast
    const toastContainer = document.createElement('div');
    toastContainer.className =
      'fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-green-600 bg-green-50 dark:bg-green-950 px-6 py-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300';
    toastContainer.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 dark:bg-green-500">
          <svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <div>
          <p class="font-heading text-sm uppercase tracking-wide text-green-900 dark:text-green-100">
            Welcome to Premium!
          </p>
          <p class="text-xs text-green-700 dark:text-green-300 mt-1">
            Your subscription is now active. Enjoy unlimited pots!
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(toastContainer);

    // Auto-dismiss after 6 seconds
    const dismissTimer = setTimeout(() => {
      toastContainer.classList.add('animate-out', 'fade-out', 'slide-out-to-top-2');
      setTimeout(() => {
        document.body.removeChild(toastContainer);
      }, 300);
    }, 6000);

    // Clean up checkout_id from URL
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('checkout_id');
    router.replace(cleanUrl.pathname + cleanUrl.search, { scroll: false });

    return () => {
      clearTimeout(dismissTimer);
      if (document.body.contains(toastContainer)) {
        document.body.removeChild(toastContainer);
      }
    };
  }, [checkoutId, router]);

  return null;
}
