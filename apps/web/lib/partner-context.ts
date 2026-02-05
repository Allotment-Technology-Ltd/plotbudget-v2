import { headers } from 'next/headers';

/**
 * Read partner context from request headers (set by middleware when partner
 * is authenticated via magic-link cookie).
 * Use this in server components/actions to load data for the partner's household
 * (e.g. with admin client filtered by householdId).
 */
export async function getPartnerContext(): Promise<{
  householdId: string | null;
  isPartner: boolean;
}> {
  const h = await headers();
  const householdId = h.get('x-partner-household-id');
  const isPartner = h.get('x-is-partner') === 'true';
  return {
    householdId: isPartner && householdId ? householdId : null,
    isPartner: !!isPartner,
  };
}
