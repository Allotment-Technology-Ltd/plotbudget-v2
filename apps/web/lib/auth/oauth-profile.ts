/**
 * Extracts display name and avatar URL from Supabase Auth user_metadata
 * (populated by OAuth providers such as Google and Apple).
 * Used to sync profile into public.users on login.
 */

export type OAuthProfile = {
  displayName: string | null;
  avatarUrl: string | null;
};

/** Safe string: non-empty after trim, max length for DB. */
function trimDisplayName(s: unknown, maxLen = 50): string | null {
  if (s == null) return null;
  const t = String(s).trim();
  return t.length > 0 ? t.slice(0, maxLen) : null;
}

/** Safe URL string for avatar. */
function trimAvatarUrl(s: unknown): string | null {
  if (s == null) return null;
  const t = String(s).trim();
  return t.length > 0 ? t : null;
}

/**
 * Build display name from provider metadata.
 * Prefers full_name, then name, then given_name + family_name (e.g. Apple).
 */
function displayNameFromMetadata(meta: Record<string, unknown>): string | null {
  const full = trimDisplayName(meta.full_name);
  if (full) return full;
  const name = trimDisplayName(meta.name);
  if (name) return name;
  const given = trimDisplayName(meta.given_name);
  const family = trimDisplayName(meta.family_name);
  if (given || family) return [given, family].filter(Boolean).join(' ').trim() || null;
  return null;
}

/**
 * Build avatar URL from provider metadata.
 * Google uses picture; Supabase may map to avatar_url.
 */
function avatarUrlFromMetadata(meta: Record<string, unknown>): string | null {
  const url = trimAvatarUrl(meta.avatar_url) ?? trimAvatarUrl(meta.picture);
  return url || null;
}

/**
 * Extract display name and avatar URL from Supabase Auth user's user_metadata.
 * Returns nulls when not present (e.g. magic link or email/password).
 */
export function getOAuthProfileFromUser(user: { user_metadata?: Record<string, unknown> | null }): OAuthProfile {
  const meta = user.user_metadata;
  if (!meta || typeof meta !== 'object') {
    return { displayName: null, avatarUrl: null };
  }
  return {
    displayName: displayNameFromMetadata(meta as Record<string, unknown>),
    avatarUrl: avatarUrlFromMetadata(meta as Record<string, unknown>),
  };
}
