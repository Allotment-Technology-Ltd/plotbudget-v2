'use server';

import { revalidatePath } from 'next/cache';
import { isAdminUser } from '@/lib/auth/admin-gate';
import { createAdminClient } from '@/lib/supabase/admin';
import type { InsertTables, UpdateTables } from '@repo/supabase';
import { z } from 'zod';

const createSchema = z.object({
  version: z.string().min(1),
  released_at: z.string().min(1),
  content: z.string(),
  display_order: z.number().int().min(0),
});

const updateSchema = createSchema.partial();

export async function getChangelogEntriesAdmin(): Promise<
  { data: InsertTables<'changelog_entries'>[] | null; error: string | null }
> {
  const ok = await isAdminUser();
  if (!ok) return { data: null, error: 'Unauthorized' };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('changelog_entries')
      .select('*')
      .order('display_order', { ascending: true })
      .order('released_at', { ascending: false });
    if (error) return { data: null, error: error.message };
    return { data: data as InsertTables<'changelog_entries'>[], error: null };
  } catch (e) {
    console.error('admin changelog getChangelogEntriesAdmin:', e);
    return { data: null, error: e instanceof Error ? e.message : 'Failed to load' };
  }
}

export async function createChangelogEntry(
  _prev: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const ok = await isAdminUser();
  if (!ok) return { error: 'Unauthorized' };
  const parsed = createSchema.safeParse({
    version: formData.get('version'),
    released_at: formData.get('released_at'),
    content: formData.get('content') ?? '',
    display_order: Number(formData.get('display_order')) || 0,
  });
  if (!parsed.success) return { error: parsed.error.flatten().formErrors.join(', ') };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('changelog_entries').insert({
      version: parsed.data.version,
      released_at: parsed.data.released_at,
      content: parsed.data.content,
      display_order: parsed.data.display_order,
    } as InsertTables<'changelog_entries'>);
    if (error) return { error: error.message };
    revalidatePath('/admin/changelog');
    return { success: true };
  } catch (e) {
    console.error('admin changelog createChangelogEntry:', e);
    return { error: e instanceof Error ? e.message : 'Failed to create' };
  }
}

export async function updateChangelogEntry(_prev: unknown, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const ok = await isAdminUser();
  if (!ok) return { error: 'Unauthorized' };
  const id = formData.get('id');
  if (typeof id !== 'string' || !id) return { error: 'Missing entry id' };
  const raw = {
    version: formData.get('version') ?? undefined,
    released_at: formData.get('released_at') ?? undefined,
    content: formData.get('content') ?? undefined,
    display_order: formData.get('display_order') != null ? Number(formData.get('display_order')) : undefined,
  };
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().formErrors.join(', ') };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('changelog_entries').update(parsed.data as UpdateTables<'changelog_entries'>).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/changelog');
    return { success: true };
  } catch (e) {
    console.error('admin changelog updateChangelogEntry:', e);
    return { error: e instanceof Error ? e.message : 'Failed to update' };
  }
}

export async function deleteChangelogEntry(id: string): Promise<{ error?: string }> {
  const ok = await isAdminUser();
  if (!ok) return { error: 'Unauthorized' };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('changelog_entries').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/changelog');
    return {};
  } catch (e) {
    console.error('admin changelog deleteChangelogEntry:', e);
    return { error: e instanceof Error ? e.message : 'Failed to delete' };
  }
}

export async function updateChangelogOrder(orderedIds: string[]): Promise<{ error?: string }> {
  const ok = await isAdminUser();
  if (!ok) return { error: 'Unauthorized' };
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return {};
  try {
    const supabase = createAdminClient();
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabase
        .from('changelog_entries')
        .update({ display_order: i })
        .eq('id', orderedIds[i]);
      if (error) return { error: error.message };
    }
    revalidatePath('/admin/changelog');
    return {};
  } catch (e) {
    console.error('admin changelog updateChangelogOrder:', e);
    return { error: e instanceof Error ? e.message : 'Failed to reorder' };
  }
}
