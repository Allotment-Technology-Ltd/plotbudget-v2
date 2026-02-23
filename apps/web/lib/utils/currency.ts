/**
 * Shared currency formatting and parsing utilities.
 * Supports GBP, USD, EUR across onboarding, dashboard, blueprint, and settings.
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

/** Regex to strip £, $, €, commas, and whitespace from input. */
const CURRENCY_STRIP_REGEX = /[£$€,\s]/g;

/**
 * Strip currency symbols (£, $, €), commas, and whitespace so "£3,100" or "$3100" parse as numbers.
 * Used for income and amount inputs across the app.
 */
export function parseIncome(value: unknown): number {
  if (value === '' || value === null || value === undefined) return NaN;
  const s = String(value).replace(CURRENCY_STRIP_REGEX, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
