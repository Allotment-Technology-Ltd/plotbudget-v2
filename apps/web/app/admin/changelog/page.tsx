import type { Metadata } from 'next';
import type { ChangelogEntry } from '@repo/supabase';
import { getChangelogEntriesAdmin } from '@/lib/actions/admin-changelog-actions';
import { AdminChangelogPanel } from '@/components/admin/admin-changelog-panel';

export const metadata: Metadata = {
  title: 'Admin — Changelog',
  description: "Edit changelog entries for What's new.",
};

export default async function AdminChangelogPage() {
  const { data, error } = await getChangelogEntriesAdmin();
  return (
    <AdminChangelogPanel
      initialData={(data ?? null) as ChangelogEntry[] | null}
      initialError={error ?? null}
    />
  );
}
