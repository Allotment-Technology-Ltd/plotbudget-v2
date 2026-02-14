/**
 * Maps Supabase Auth identity provider IDs to human-readable labels for display in settings.
 */
const PROVIDER_LABELS: Record<string, string> = {
  email: 'Email & password',
  google: 'Google',
  apple: 'Apple',
  // Magic link uses email provider; we show "Email & password" which covers both
  phone: 'Phone',
};

/**
 * Returns a sorted, deduplicated list of sign-in method labels for the given provider IDs.
 * Provider IDs come from Supabase Auth identities (e.g. from getUserIdentities).
 */
export function getSignInMethodLabels(providers: string[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const p of providers) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const label = PROVIDER_LABELS[key] ?? key;
    labels.push(label);
  }
  return labels.sort((a, b) => a.localeCompare(b));
}
