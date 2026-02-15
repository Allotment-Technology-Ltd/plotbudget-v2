/**
 * Shared currency formatting and parsing utilities.
 * Used by web dashboard, native dashboard, and other apps.
 */

export type CurrencyCode = 'GBP' | 'USD' | 'EUR';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
};

/** Currency symbol for display (e.g. £, $, €). */
export function currencySymbol(currency: CurrencyCode | null | undefined): string {
  if (!currency || !(currency in CURRENCY_SYMBOLS)) return '£';
  return CURRENCY_SYMBOLS[currency as CurrencyCode];
}

/** Format amount with currency symbol (e.g. £1,234.56). */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode | null | undefined
): string {
  const symbol = currencySymbol(currency);
  return `${symbol}${amount.toFixed(2)}`;
}
