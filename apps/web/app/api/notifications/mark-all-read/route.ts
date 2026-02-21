import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * PATCH /api/notifications/mark-all-read
 * Mark all unread notifications for the current user as read.
 */
export async function PATCH() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true } as never)
    .eq('user_id', user.id)
    .eq('is_read', false)
    .select('id');

  if (error) {
    return NextResponse.json(
      { error: error.message ?? 'Failed to mark notifications read' },
      { status: 500 }
    );
  }
  return NextResponse.json({ count: data?.length ?? 0 });
}
