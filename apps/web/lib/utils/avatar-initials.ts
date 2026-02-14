/**
 * Avatar fallback initials when no OAuth avatar image is set.
 * - If display name has two or more words (e.g. "First Last"): first letter of first + first letter of last.
 * - If display name is a single word: first letter of display name.
 * - If no display name: first letter of email.
 * Returns uppercase, max 2 characters.
 */
export function getAvatarInitials(
  displayName: string | null | undefined,
  email: string
): string {
  const name = displayName?.trim();
  if (name && name.length > 0) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0]!.charAt(0);
      const last = parts[parts.length - 1]!.charAt(0);
      return (first + last).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }
  const e = (email || '').trim();
  return e.length > 0 ? e.charAt(0).toUpperCase() : '?';
}
