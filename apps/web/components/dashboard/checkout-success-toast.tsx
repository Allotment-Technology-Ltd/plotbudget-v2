'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function CheckoutSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutId = searchParams?.get('checkout_id');

  useEffect(() => {
    if (!checkoutId) return;

    // Show success toast (DOM only — no innerHTML for security audit)
    const toastContainer = document.createElement('div');
    toastContainer.className =
      'fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-green-600 bg-green-50 dark:bg-green-950 px-6 py-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300';
    const inner = document.createElement('div');
    inner.className = 'flex items-center gap-3';
    const iconWrap = document.createElement('div');
    iconWrap.className = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 dark:bg-green-500';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'h-5 w-5 text-white');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('stroke', 'currentColor');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', 'M5 13l4 4L19 7');
    svg.appendChild(path);
    iconWrap.appendChild(svg);
    const textWrap = document.createElement('div');
    const p1 = document.createElement('p');
    p1.className = 'font-heading text-sm uppercase tracking-wide text-green-900 dark:text-green-100';
    p1.textContent = 'Welcome to Premium!';
    const p2 = document.createElement('p');
    p2.className = 'text-xs text-green-700 dark:text-green-300 mt-1';
    p2.textContent = 'Your subscription is now active. Enjoy unlimited pots!';
    textWrap.appendChild(p1);
    textWrap.appendChild(p2);
    inner.appendChild(iconWrap);
    inner.appendChild(textWrap);
    toastContainer.appendChild(inner);
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
