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
} as const;
