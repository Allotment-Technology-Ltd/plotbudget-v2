/**
 * Format prep and cook time for display (e.g. "15 min prep · 30 min cook" or "45 min total").
 * Returns empty string if neither is set.
 */
export function formatRecipeTime(
  prep_mins?: number | null,
  cook_mins?: number | null
): string {
  const prep = prep_mins != null && prep_mins > 0 ? prep_mins : 0;
  const cook = cook_mins != null && cook_mins > 0 ? cook_mins : 0;
  if (prep === 0 && cook === 0) return '';
  if (prep > 0 && cook > 0) return `${prep} min prep · ${cook} min cook`;
  if (prep > 0) return `${prep} min prep`;
  return `${cook} min cook`;
}
