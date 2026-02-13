// apps/web/tests/utils/db-cleanup.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseServiceKey) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY required for test cleanup. ' +
      'Get it from Supabase Dashboard > Settings > API > service_role key'
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Cleanup test data for specific test user
 * Preserves the user account and household, only deletes mutable data
 */
export async function cleanupTestUser(email: string) {
  console.log(`🧹 Cleaning up test data for ${email}`);

  // Get user and household from public.users
  const { data: user } = await supabase
    .from('users')
    .select('id, household_id, current_paycycle_id')
    .eq('email', email)
    .single();

  if (!user) {
    console.warn(`⚠️  User ${email} not found`);
    return;
  }

  let householdId = user.household_id;

  if (!householdId) {
    // User may own a household; get by owner_id
    const { data: household } = await supabase
      .from('households')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    householdId = household?.id ?? null;
  }

  if (!householdId) {
    // User may be partner of a household (e.g. partner@plotbudget.test); clear that link
    await supabase
      .from('households')
      .update({
        partner_user_id: null,
        partner_email: null,
        partner_auth_token: null,
        partner_invite_status: 'none',
        partner_invite_sent_at: null,
        partner_accepted_at: null,
        partner_last_login_at: null,
      } as Record<string, unknown>)
      .eq('partner_user_id', user.id);
    console.log(`✅ Cleared partner link for ${email}`);
    return;
  }

  // Delete in dependency order (children first)
  await supabase.from('seeds').delete().eq('household_id', householdId);
  await supabase.from('repayments').delete().eq('household_id', householdId);
  await supabase.from('pots').delete().eq('household_id', householdId);

  // Keep most recent pay cycle, delete others; ensure user.current_paycycle_id points to a valid one
  const { data: cycles } = await supabase
    .from('paycycles')
    .select('id, start_date')
    .eq('household_id', householdId)
    .order('start_date', { ascending: false });

  if (cycles && cycles.length > 0) {
    if (cycles.length > 1) {
      const idsToDelete = cycles.slice(1).map((c) => c.id);
      await supabase.from('paycycles').delete().in('id', idsToDelete);
    }
    // Ensure user.current_paycycle_id points to the kept paycycle (avoids FK on seeds)
    await supabase.from('users').update({ current_paycycle_id: cycles[0].id }).eq('id', user.id);
    // Reset ritual_closed_at so "Close cycle" CTA can appear again in ritual e2e tests
    await supabase
      .from('paycycles')
      .update({ ritual_closed_at: null })
      .eq('id', cycles[0].id);
  }

  console.log(`✅ Cleaned up test data for ${email}`);
}

/**
 * Reset a test user so they have not completed onboarding.
 * Use before onboarding tests so /onboarding is not redirected to dashboard.
 */
export async function resetOnboardingState(email: string) {
  const { data: user } = await supabase
    .from('users')
    .select('id, household_id')
    .eq('email', email)
    .single();

  if (!user) return;

  let householdId = user.household_id;
  if (!householdId) {
    const { data: household } = await supabase
      .from('households')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    householdId = household?.id ?? null;
  }

  if (householdId) {
    await supabase.from('seeds').delete().eq('household_id', householdId);
    await supabase.from('repayments').delete().eq('household_id', householdId);
    await supabase.from('pots').delete().eq('household_id', householdId);
    await supabase.from('paycycles').delete().eq('household_id', householdId);
    await supabase.from('households').delete().eq('id', householdId);
  }

  await supabase
    .from('users')
    .update({
      household_id: null,
      current_paycycle_id: null,
      has_completed_onboarding: false,
    })
    .eq('id', user.id);
}

/**
 * Ensure the auth user exists (create with admin API if not).
 * Use for test-only users like blueprint@ so we can log in without seed.
 */
export async function ensureAuthUserExists(email: string, password: string) {
  const {
    data: { users },
  } = await supabase.auth.admin.listUsers({ perPage: 100 });
  const existing = users?.find((u) => u.email === email);
  if (existing) return;

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.warn(`⚠️  Failed to create auth user ${email}:`, error.message);
  } else {
    console.log(`✅ Auth user created: ${email}`);
  }
}

/**
 * Ensure a row exists in public.users for the given auth user (by email).
 * Uses service role to look up auth.users and upsert into public.users.
 * Call after login so ensureBlueprintReady and proxy can find the user.
 */
export async function ensureUserInPublicUsers(email: string) {
  const {
    data: { users },
  } = await supabase.auth.admin.listUsers({ perPage: 100 });
  const authUser = users?.find((u) => u.email === email);
  if (!authUser) {
    console.warn(`⚠️  Auth user not found: ${email}`);
    return;
  }

  const { error } = await supabase
    .from('users')
    .upsert(
      {
        id: authUser.id,
        email: authUser.email ?? email,
        subscription_tier: 'free',
      },
      { onConflict: 'id' }
    );

  if (error) {
    console.warn(`⚠️  Failed to upsert public.users for ${email}:`, error.message);
    return;
  }
  console.log(`✅ User ${email} synced to public.users`);
}

/**
 * Ensure a test user has a household and completed onboarding so /dashboard/blueprint loads.
 * Creates a minimal household + paycycle if the user has none (e.g. after onboarding tests reset them).
 */
export async function ensureBlueprintReady(email: string) {
  const { data: user } = await supabase
    .from('users')
    .select('id, household_id')
    .eq('email', email)
    .single();

  if (!user) return;

  let householdId = user.household_id;
  if (!householdId) {
    const { data: household } = await supabase
      .from('households')
      .select('id')
      .eq('owner_id', user.id)
      .single();
    householdId = household?.id ?? null;
  }

  if (householdId) {
    // User already has a household; cleanup mutable data only
    await cleanupTestUser(email);
    return;
  }

  // Create minimal household and paycycle so /dashboard/blueprint is reachable
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startStr = startDate.toISOString().slice(0, 10);
  const endStr = endDate.toISOString().slice(0, 10);

  const { data: newHousehold, error: hErr } = await supabase
    .from('households')
    .insert({
      owner_id: user.id,
      is_couple: false,
      pay_cycle_type: 'specific_date',
      pay_day: 1,
      total_monthly_income: 0,
      needs_percent: 50,
      wants_percent: 30,
      savings_percent: 10,
      repay_percent: 10,
      joint_ratio: 0.5,
    })
    .select('id')
    .single();

  if (hErr || !newHousehold) {
    console.warn(`⚠️  Failed to create household for ${email}:`, hErr?.message);
    return;
  }

  const { data: newPaycycle, error: pErr } = await supabase
    .from('paycycles')
    .insert({
      household_id: newHousehold.id,
      start_date: startStr,
      end_date: endStr,
      status: 'active',
      total_income: 0,
      snapshot_user_income: 0,
      snapshot_partner_income: 0,
      total_allocated: 0,
    })
    .select('id')
    .single();

  if (pErr || !newPaycycle) {
    await supabase.from('households').delete().eq('id', newHousehold.id);
    console.warn(`⚠️  Failed to create paycycle for ${email}:`, pErr?.message);
    return;
  }

  await supabase
    .from('users')
    .update({
      household_id: newHousehold.id,
      current_paycycle_id: newPaycycle.id,
      has_completed_onboarding: true,
    })
    .eq('id', user.id);

  console.log(`✅ Blueprint ready for ${email}`);
}

/**
 * Ensure a household has a pending partner invite with the given token, and the partner user exists.
 * Used by partner invite e2e: ownerEmail = dashboard (or solo), partnerEmail = partner@plotbudget.test.
 */
export async function ensurePartnerInviteReady(
  ownerEmail: string,
  partnerEmail: string,
  token: string
) {
  await ensureAuthUserExists(partnerEmail, 'test-password-123');
  await ensureUserInPublicUsers(partnerEmail);

  const { data: owner } = await supabase
    .from('users')
    .select('id')
    .eq('email', ownerEmail)
    .single();

  if (!owner) {
    console.warn(`⚠️  Owner ${ownerEmail} not found for partner invite`);
    return;
  }

  const { data: household } = await supabase
    .from('households')
    .select('id')
    .eq('owner_id', owner.id)
    .maybeSingle();

  if (!household) {
    await ensureBlueprintReady(ownerEmail);
    const { data: h } = await supabase
      .from('households')
      .select('id')
      .eq('owner_id', owner.id)
      .single();
    if (!h) {
      console.warn(`⚠️  No household for ${ownerEmail}`);
      return;
    }
  }

  const { error } = await supabase
    .from('households')
    .update({
      is_couple: true,
      partner_email: partnerEmail,
      partner_auth_token: token,
      partner_invite_status: 'pending',
      partner_invite_sent_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('owner_id', owner.id);

  if (error) {
    console.warn(`⚠️  Failed to set partner invite for ${ownerEmail}:`, error.message);
  } else {
    console.log(`✅ Partner invite ready: ${ownerEmail} -> ${partnerEmail}`);
  }
}

/**
 * Ensure partner user is linked to owner's household (partner_user_id set) and save auth state.
 * Call after ensurePartnerInviteReady; then login as partner and save state to partner.json.
 */
export async function linkPartnerToHousehold(ownerEmail: string, partnerEmail: string) {
  const {
    data: { users: authUsers },
  } = await supabase.auth.admin.listUsers({ perPage: 100 });
  const partnerAuth = authUsers?.find((u) => u.email === partnerEmail);
  if (!partnerAuth) return;

  const { data: owner } = await supabase
    .from('users')
    .select('id')
    .eq('email', ownerEmail)
    .single();
  if (!owner) return;

  const { error } = await supabase
    .from('households')
    .update({
      partner_user_id: partnerAuth.id,
      partner_invite_status: 'accepted',
      partner_accepted_at: new Date().toISOString(),
      partner_last_login_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('owner_id', owner.id);

  if (error) {
    console.warn(`⚠️  Failed to link partner:`, error.message);
  } else {
    console.log(`✅ Partner ${partnerEmail} linked to ${ownerEmail} household`);
  }
}

/**
 * Cleanup all test users (run before test suite).
 * Do NOT add manual-solo@plotbudget.test or manual-couple@plotbudget.test —
 * those are for manual regression only (see apps/web/scripts/seed-manual-regression.sql).
 */
export async function cleanupAllTestUsers() {
  await cleanupTestUser('solo@plotbudget.test');
  await cleanupTestUser('couple@plotbudget.test');
  await cleanupTestUser('blueprint@plotbudget.test');
  await cleanupTestUser('ritual@plotbudget.test');
  await cleanupTestUser('dashboard@plotbudget.test');
  await cleanupTestUser('partner@plotbudget.test');
  await cleanupTestUser('onboarding@plotbudget.test');
  await cleanupTestUser('visual@plotbudget.test');
}
