'use server';

/**
 * Avatar is read-only and comes from the user's OAuth account (Google, Apple).
 * Upload is disabled; this action exists only to return a clear error if called.
 */
export async function uploadAvatar(_formData: FormData): Promise<{ avatarUrl?: string; error?: string }> {
  return { error: 'Avatar cannot be changed. It is linked to your sign-in account (e.g. Google or Apple).' };
}
