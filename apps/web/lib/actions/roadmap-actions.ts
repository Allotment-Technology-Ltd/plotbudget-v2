// @ts-nocheck
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database, RoadmapFeature } from '@repo/supabase';
import { z } from 'zod';

type RoadmapVoteInsert = Database['public']['Tables']['roadmap_votes']['Insert'];

const featureIdSchema = z.string().uuid();

export type RoadmapFeatureWithVotes = {
  id: string;
  title: string;
  description: string;
  module_key: string;
  icon_name: string;
  status: 'now' | 'next' | 'later' | 'shipped';
  display_order: number;
  key_features: string[];
  vote_count: number;
  user_has_voted: boolean;
};

/**
 * Fetch all roadmap features with vote counts and current user's vote status.
 * Public: vote counts and features. User vote status only when authenticated with a household.
 */
export async function getRoadmapFeaturesWithVotes(): Promise<{
  features: RoadmapFeatureWithVotes[];
  error?: string;
}> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: featuresData, error: featuresError } = await supabase
      .from('roadmap_features')
      .select('id, title, description, module_key, icon_name, status, display_order, key_features')
      .order('display_order', { ascending: true });

    if (featuresError) {
      console.error('roadmap getRoadmapFeaturesWithVotes features:', featuresError);
      return { features: [], error: featuresError.message };
    }

    const features = (featuresData ?? []) as Pick<RoadmapFeature, 'id' | 'title' | 'description' | 'module_key' | 'icon_name' | 'status' | 'display_order' | 'key_features'>[];
    const featureIds = features.map((f) => f.id);

    const { data: voteCounts, error: countsError } = await supabase
      .from('roadmap_votes')
      .select('feature_id')
      .in('feature_id', featureIds);

    if (countsError) {
      console.error('roadmap getRoadmapFeaturesWithVotes counts:', countsError);
      return { features: [], error: countsError.message };
    }

    const countByFeature: Record<string, number> = {};
    for (const id of featureIds) countByFeature[id] = 0;
    for (const row of voteCounts ?? []) {
      const fid = (row as { feature_id: string }).feature_id;
      if (fid) countByFeature[fid] = (countByFeature[fid] ?? 0) + 1;
    }

    const userVotedIds: Set<string> = new Set();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', user.id)
        .maybeSingle();
      const householdId = (userProfile as { household_id: string | null } | null)?.household_id ?? null;
      if (householdId && featureIds.length > 0) {
        const { data: myVotes } = await supabase
          .from('roadmap_votes')
          .select('feature_id')
          .eq('household_id', householdId)
          .in('feature_id', featureIds);
        for (const row of myVotes ?? []) {
          const fid = (row as { feature_id: string }).feature_id;
          if (fid) userVotedIds.add(fid);
        }
      }
    }

    const result: RoadmapFeatureWithVotes[] = (features ?? []).map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      module_key: f.module_key,
      icon_name: f.icon_name,
      status: f.status as 'now' | 'next' | 'later' | 'shipped',
      display_order: Number(f.display_order),
      key_features: f.key_features ?? [],
      vote_count: countByFeature[f.id] ?? 0,
      user_has_voted: userVotedIds.has(f.id),
    }));

    return { features: result };
  } catch (e) {
    console.error('roadmap getRoadmapFeaturesWithVotes:', e);
    return { features: [], error: e instanceof Error ? e.message : 'Failed to load roadmap' };
  }
}

/**
 * Toggle vote for a feature: add if not voted, remove if already voted.
 * One vote per household per feature (enforced by DB unique constraint).
 * Returns updated vote count and voted state; revalidates /roadmap.
 */
export async function toggleRoadmapVote(featureId: string): Promise<{
  voteCount?: number;
  voted?: boolean;
  error?: string;
}> {
  const parsed = featureIdSchema.safeParse(featureId);
  if (!parsed.success) {
    return { error: 'Invalid feature' };
  }
  const fid = parsed.data;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Sign in to vote' };
    }

    const { data: profile } = await supabase
      .from('users')
      .select('household_id')
      .eq('id', user.id)
      .maybeSingle();
    const householdId = (profile as { household_id: string | null } | null)?.household_id ?? null;
    if (!householdId) {
      return { error: 'Join a household to vote' };
    }

    const { data: household } = await supabase
      .from('households')
      .select('founding_member_until')
      .eq('id', householdId)
      .maybeSingle();
    const until = (household as { founding_member_until: string | null } | null)?.founding_member_until ?? null;
    if (!until || new Date(until) <= new Date()) {
      return { error: 'Roadmap voting is for founding members' };
    }

    const { data: existing } = await supabase
      .from('roadmap_votes')
      .select('id')
      .eq('feature_id', fid)
      .eq('household_id', householdId)
      .maybeSingle();

    if (existing) {
      const { error: delError } = await supabase
        .from('roadmap_votes')
        .delete()
        .eq('feature_id', fid)
        .eq('household_id', householdId);
      if (delError) {
        console.error('roadmap toggleRoadmapVote delete:', delError);
        return { error: delError.message };
      }
      const { count } = await supabase
        .from('roadmap_votes')
        .select('*', { count: 'exact', head: true })
        .eq('feature_id', fid);
      revalidatePath('/roadmap');
      return { voteCount: count ?? 0, voted: false };
    }

    const insertData: RoadmapVoteInsert = {
      feature_id: fid,
      household_id: householdId,
      user_id: user.id,
    };
    const { error: insertError } = await supabase.from('roadmap_votes').insert(insertData);
    if (insertError) {
      if (insertError.code === '23505') {
        return { error: 'You have already voted for this feature' };
      }
      console.error('roadmap toggleRoadmapVote insert:', insertError);
      return { error: insertError.message };
    }

    const { count } = await supabase
      .from('roadmap_votes')
      .select('*', { count: 'exact', head: true })
      .eq('feature_id', fid);
    revalidatePath('/roadmap');
    return { voteCount: count ?? 0, voted: true };
  } catch (e) {
    console.error('roadmap toggleRoadmapVote:', e);
    return { error: e instanceof Error ? e.message : 'Failed to update vote' };
  }
}

/**
 * Returns the current user's roadmap vote eligibility (isAuthenticated + canVote).
 * Safe to call from client components via server action — auth is enforced server-side.
 */
export async function getMyRoadmapVoteEligibility(): Promise<{ isAuthenticated: boolean; canVote: boolean }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isAuthenticated: false, canVote: false };

    const { data: profile } = await supabase
      .from('users')
      .select('household_id')
      .eq('id', user.id)
      .maybeSingle();
    const householdId = (profile as { household_id: string | null } | null)?.household_id ?? null;
    if (!householdId) return { isAuthenticated: true, canVote: false };

    const { data: household } = await supabase
      .from('households')
      .select('founding_member_until')
      .eq('id', householdId)
      .maybeSingle();
    const until = (household as { founding_member_until: string | null } | null)?.founding_member_until ?? null;
    return { isAuthenticated: true, canVote: !!until && new Date(until) > new Date() };
  } catch {
    return { isAuthenticated: false, canVote: false };
  }
}

