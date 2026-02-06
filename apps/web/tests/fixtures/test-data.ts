// apps/web/tests/fixtures/test-data.ts

/**
 * Test users that exist in Supabase and are reused across tests.
 * See docs/spec.md E2E Testing Standards.
 */
export const TEST_USERS = {
  solo: { email: 'solo@plotbudget.test', password: 'test-password-123' },
  couple: { email: 'couple@plotbudget.test', password: 'test-password-123' },
  /** Used only by blueprint specs so onboarding resets don't affect them */
  blueprint: { email: 'blueprint@plotbudget.test', password: 'test-password-123' },
  /** Used only by ritual (Payday Ritual) specs; isolated for parallel runs */
  ritual: { email: 'ritual@plotbudget.test', password: 'test-password-123' },
  /** Used only by dashboard/settings specs; isolated so blueprint cleanup doesn't affect it */
  dashboard: { email: 'dashboard@plotbudget.test', password: 'test-password-123' },
  /** Used by partner invite e2e: accepts invite and can use Leave */
  partner: { email: 'partner@plotbudget.test', password: 'test-password-123' },
  /** Used only by onboarding spec (full flow) so no other test resets or shares this user */
  onboarding: { email: 'onboarding@plotbudget.test', password: 'test-password-123' },
  /** Used only by visual regression specs; isolated so they can run in parallel with other E2E */
  visual: { email: 'visual@plotbudget.test', password: 'test-password-123' },
} as const;

/** Token used in e2e for partner invite link; must match DB state from ensurePartnerInviteReady */
export const E2E_PARTNER_INVITE_TOKEN = 'e2e-partner-invite-token';
