import { redirect } from 'next/navigation';

/**
 * Redirect legacy /dashboard/blueprint to /dashboard/money/blueprint.
 * Preserves search params (cycle, edit, editPot, editRepayment, newCycle).
 */
export default async function BlueprintRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = new URLSearchParams();
  const allowed = ['cycle', 'edit', 'editPot', 'editRepayment', 'newCycle'];
  for (const key of allowed) {
    const v = params[key];
    if (v !== undefined) search.set(key, Array.isArray(v) ? v[0]! : v);
  }
  const qs = search.toString();
  redirect(`/dashboard/money/blueprint${qs ? `?${qs}` : ''}`);
}
