'use server';

import { revalidatePath } from 'next/cache';
import { isAdminUser } from '@/lib/auth/admin-gate';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@repo/supabase';
import { z } from 'zod';

type RoadmapFeatureRow = Database['public']['Tables']['roadmap_features']['Row'];
type RoadmapInsert = Database['public']['Tables']['roadmap_features']['Insert'];
type RoadmapUpdate = Database['public']['Tables']['roadmap_features']['Update'];

const statusSchema = z.enum(['now', 'next', 'later', 'shipped']);

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  module_key: z.string().min(1),
  icon_name: z.string().min(1),
  status: statusSchema,
  display_order: z.number().int().min(0),
  key_features: z.array(z.string()),
  estimated_timeline: z.string().nullable(),
});

const updateSchema = createSchema.partial();

function parseKeyFeatures(value: FormDataEntryValue | null): string[] {
  if (value == null || typeof value !== 'string') return [];
  return value.split('\n').map((s) => s.trim()).filter(Boolean);
}

export async function getRoadmapFeaturesAdmin(): Promise<{
  data: RoadmapFeatureRow[] | null;
  error: string | null;
}> {
  const ok = await isAdminUser();
  if (!ok) return { data: null, error: 'Unauthorized' };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('roadmap_features')
      .select('*')
      .order('status', { ascending: true })
      .order('display_order', { ascending: true });
    if (error) return { data: null, error: error.message };
    return { data: (data ?? null) as RoadmapFeatureRow[] | null, error: null };
  } catch (e) {
    console.error('admin roadmap getRoadmapFeaturesAdmin:', e);
    return { data: null, error: e instanceof Error ? e.message : 'Failed to load' };
  }
}

export async function createRoadmapFeature(_prev: unknown, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const ok = await isAdminUser();
  if (!ok) return { error: 'Unauthorized' };
  const parsed = createSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    module_key: formData.get('module_key'),
    icon_name: formData.get('icon_name'),
    status: formData.get('status'),
    display_order: Number(formData.get('display_order')),
    key_features: parseKeyFeatures(formData.get('key_features')),
    estimated_timeline: (formData.get('estimated_timeline') as string) || null,
  });
  if (!parsed.success) return { error: parsed.error.flatten().formErrors.join(', ') };
  try {
    const supabase = createAdminClient();
    const payload: RoadmapInsert = parsed.data;
    const table = supabase.from('roadmap_features') as unknown as {
      insert(values: RoadmapInsert): PromiseLike<{ error: { message: string } | null }>;
    };
    const { error } = await table.insert(payload);
    if (error) return { error: error.message };
    revalidatePath('/admin/roadmap');
    revalidatePath('/roadmap');
    return { success: true };
  } catch (e) {
    console.error('admin roadmap createRoadmapFeature:', e);
    return { error: e instanceof Error ? e.message : 'Failed to create' };
  }
}

export async function updateRoadmapFeature(_prev: unknown, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const ok = await isAdminUser();
  if (!ok) return { error: 'Unauthorized' };
  const id = formData.get('id');
  if (typeof id !== 'string' || !id) return { error: 'Missing feature id' };
  const keyFeaturesRaw = formData.get('key_features');
  const raw = {
    title: formData.get('title') ?? undefined,
    description: formData.get('description') ?? undefined,
    module_key: formData.get('module_key') ?? undefined,
    icon_name: formData.get('icon_name') ?? undefined,
    status: formData.get('status') ?? undefined,
    display_order: formData.get('display_order') != null ? Number(formData.get('display_order')) : undefined,
    key_features: keyFeaturesRaw != null ? parseKeyFeatures(keyFeaturesRaw) : undefined,
    estimated_timeline: formData.has('estimated_timeline') ? ((formData.get('estimated_timeline') as string) || null) : undefined,
  };
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().formErrors.join(', ') };
  try {
    const supabase = createAdminClient();
    const payload: RoadmapUpdate = parsed.data;
    const table = supabase.from('roadmap_features') as unknown as {
      update(values: RoadmapUpdate): { eq(column: string, value: string): PromiseLike<{ error: { message: string } | null }> };
    };
    const { error } = await table.update(payload).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/roadmap');
    revalidatePath('/roadmap');
    return { success: true };
  } catch (e) {
    console.error('admin roadmap updateRoadmapFeature:', e);
    return { error: e instanceof Error ? e.message : 'Failed to update' };
  }
}

export async function deleteRoadmapFeature(id: string): Promise<{ error?: string }> {
  const ok = await isAdminUser();
  if (!ok) return { error: 'Unauthorized' };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('roadmap_features').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/roadmap');
    revalidatePath('/roadmap');
    return {};
  } catch (e) {
    console.error('admin roadmap deleteRoadmapFeature:', e);
    return { error: e instanceof Error ? e.message : 'Failed to delete' };
  }
}

export async function updateRoadmapOrder(orderedIds: string[]): Promise<{ error?: string }> {
  const ok = await isAdminUser();
  if (!ok) return { error: 'Unauthorized' };
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return {};
  try {
    const supabase = createAdminClient();
    const table = supabase.from('roadmap_features') as unknown as {
      update(values: RoadmapUpdate): { eq(column: string, value: string): PromiseLike<{ error: { message: string } | null }> };
    };
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await table.update({ display_order: i }).eq('id', orderedIds[i]);
      if (error) return { error: error.message };
    }
    revalidatePath('/admin/roadmap');
    revalidatePath('/roadmap');
    return {};
  } catch (e) {
    console.error('admin roadmap updateRoadmapOrder:', e);
    return { error: e instanceof Error ? e.message : 'Failed to reorder' };
  }
}
