/**
 * Shared dashboard state/derivations to keep DashboardClient thin.
 */

export function useIsFoundingMember(
  foundingMemberUntil: string | null | undefined,
  userId: string | undefined
): boolean {
  if (!foundingMemberUntil || !userId) return false;
  return new Date(foundingMemberUntil) > new Date();
}
