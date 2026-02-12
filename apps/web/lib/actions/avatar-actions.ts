'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerFeatureFlags } from '@/lib/posthog-server-flags';
import type { Database } from '@/lib/supabase/database.types';
import { revalidatePath } from 'next/cache';

type UsersUpdate = Database['public']['Tables']['users']['Update'];

const AVATARS_BUCKET = 'avatars';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload processed avatar (WebP blob) to Supabase Storage and update user.avatar_url.
 * Call with FormData containing a single file under key "avatar".
 */
export async function uploadAvatar(formData: FormData): Promise<{ avatarUrl?: string; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const flags = await getServerFeatureFlags(user.id);
  if (!flags.avatarEnabled) {
    return { error: 'Avatar feature is not enabled' };
  }

  const file = formData.get('avatar');
  if (!file || !(file instanceof File)) {
    return { error: 'No avatar file provided' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: 'Image must be smaller than 5MB' };
  }

  if (!file.type.startsWith('image/')) {
    return { error: 'File must be an image' };
  }

  const timestamp = Date.now();
  const filename = `avatar_${timestamp}.webp`;
  const objectPath = `${user.id}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(objectPath, file, {
      contentType: 'image/webp',
      upsert: false,
    });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { data: urlData } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(objectPath);
  const avatarUrl = urlData.publicUrl;

  type UserAvatarRow = { avatar_url: string | null };
  const { data: oldRow } = await supabase
    .from('users')
    .select('avatar_url')
    .eq('id', user.id)
    .single();

  const payload: UsersUpdate = { avatar_url: avatarUrl };
  const { error: updateError } = await supabase
    .from('users')
    .update(payload as never)
    .eq('id', user.id);

  if (updateError) {
    return { error: `Database update failed: ${updateError.message}` };
  }

  const previousUrl = (oldRow as UserAvatarRow | null)?.avatar_url;
  if (previousUrl && previousUrl !== avatarUrl) {
    const oldPath = extractStoragePathFromPublicUrl(previousUrl, AVATARS_BUCKET);
    if (oldPath) {
      await supabase.storage.from(AVATARS_BUCKET).remove([oldPath]);
    }
  }

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard', 'layout');

  return { avatarUrl };
}

function extractStoragePathFromPublicUrl(publicUrl: string, bucket: string): string | null {
  const match = publicUrl.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`));
  return match ? match[1] : null;
}
