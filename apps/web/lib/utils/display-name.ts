/**
 * Format a display name for use in UI labels (e.g. payment source badges).
 * Uses first word, uppercased. Fallback when empty (also uppercased).
 */
export function formatDisplayNameForLabel(
  name: string | null | undefined,
  fallback: string
): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return fallback.toUpperCase();
  const firstWord = trimmed.split(/\s+/)[0];
  return firstWord ? firstWord.toUpperCase() : fallback.toUpperCase();
}

/**
 * Format income source name with actual person names, all uppercase (e.g. "ADAM'S SALARY" instead of "My salary").
 */
export function formatIncomeSourceDisplayName(
  name: string,
  payment_source: 'me' | 'partner' | 'joint',
  ownerLabel: string,
  partnerLabel: string
): string {
  if (payment_source === 'joint') return name.toUpperCase();
  const stripped = name.replace(/^(my|partner('s)?)\s+/i, '').trim() || 'income';
  const result =
    payment_source === 'me'
      ? `${ownerLabel}'s ${stripped}`
      : `${partnerLabel}'s ${stripped}`;
  return result.toUpperCase();
}
