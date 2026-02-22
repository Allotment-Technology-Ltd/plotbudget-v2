import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Banknote, Package, List } from 'lucide-react';
import { getCachedDashboardAuth, getCachedSupabase } from '@/lib/auth/server-auth-cache';
import { getModule, calculateTripBudget } from '@repo/logic';
import type { Trip, ItineraryEntry, TripBudgetItem, PackingItem } from '@repo/supabase';

const MODULE_COLOR = getModule('holidays').colorLight;

const ENTRY_TYPE_LABELS: Record<string, string> = {
  travel: 'Travel',
  accommodation: 'Accommodation',
  activity: 'Activity',
  dining: 'Dining',
  other: 'Other',
};

const CATEGORY_LABELS: Record<string, string> = {
  flights: 'Flights',
  accommodation: 'Accommodation',
  car_rental: 'Car rental',
  activities: 'Activities',
  food: 'Food',
  transport: 'Transport',
  other: 'Other',
};

function fmt(amount: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { user, profile, partnerOf } = await getCachedDashboardAuth();
  if (!user) redirect('/login');
  const householdId = profile?.household_id ?? partnerOf?.id ?? null;
  if (!householdId) redirect('/onboarding');

  const supabase = await getCachedSupabase();

  // Parallel data fetches (no waterfall — Time Respect / Performance)
  const [tripResult, itineraryResult, budgetResult, packingResult] = await Promise.all([
    supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .eq('household_id', householdId)
      .single(),
    supabase
      .from('itinerary_entries')
      .select('*')
      .eq('trip_id', id)
      .eq('household_id', householdId)
      .order('date', { ascending: true })
      .order('sort_order', { ascending: true }),
    supabase
      .from('trip_budget_items')
      .select('*')
      .eq('trip_id', id)
      .eq('household_id', householdId)
      .order('category', { ascending: true }),
    supabase
      .from('packing_items')
      .select('*')
      .eq('trip_id', id)
      .eq('household_id', householdId)
      .order('sort_order', { ascending: true }),
  ]);

  if (tripResult.error || !tripResult.data) notFound();

  const trip = tripResult.data as Trip;
  const itinerary = (itineraryResult.data ?? []) as ItineraryEntry[];
  const budgetItems = (budgetResult.data ?? []) as TripBudgetItem[];
  const packingItems = (packingResult.data ?? []) as PackingItem[];

  const budgetSummary = calculateTripBudget(
    budgetItems.map((b) => ({
      category: b.category,
      planned_amount: b.planned_amount,
      actual_amount: b.actual_amount,
    }))
  );

  const packedCount = packingItems.filter((p) => p.is_packed).length;

  return (
    <div className="content-wrapper section-padding" data-testid="trip-detail-page">
      {/* Back link */}
      <Link
        href="/dashboard/holidays"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        data-testid="back-to-holidays"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All trips
      </Link>

      {/* Header */}
      <div
        className="rounded-lg border border-border bg-card p-6 mb-6"
        style={{ borderLeftWidth: 4, borderLeftColor: MODULE_COLOR }}
      >
        <h1 className="font-heading text-2xl uppercase tracking-widest text-foreground mb-1">
          {trip.name}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" aria-hidden />
            {trip.destination}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" aria-hidden />
            {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
          </span>
          <span
            className="rounded px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: MODULE_COLOR }}
          >
            {trip.status.replace('_', ' ')}
          </span>
        </div>
        {trip.notes && (
          <p className="mt-3 text-sm text-muted-foreground">{trip.notes}</p>
        )}
      </div>

      {/* Itinerary */}
      <section className="mb-8" aria-labelledby="itinerary-heading">
        <h2
          id="itinerary-heading"
          className="font-heading text-lg uppercase tracking-wider text-foreground mb-4 flex items-center gap-2"
        >
          <List className="h-5 w-5" style={{ color: MODULE_COLOR }} aria-hidden />
          Itinerary
        </h2>
        {itinerary.length === 0 ? (
          <p className="text-sm text-muted-foreground">No itinerary entries yet.</p>
        ) : (
          <ol className="space-y-3">
            {itinerary.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-border bg-card p-4"
                data-testid={`itinerary-entry-${entry.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-medium text-foreground">{entry.title}</span>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{entry.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {ENTRY_TYPE_LABELS[entry.entry_type] ?? entry.entry_type}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{formatDate(entry.date)}</span>
                  {entry.start_time && <span>{entry.start_time}{entry.end_time ? ` – ${entry.end_time}` : ''}</span>}
                  {entry.cost_amount != null && (
                    <span>{fmt(entry.cost_amount, entry.cost_currency ?? trip.currency)}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Budget breakdown */}
      <section className="mb-8" aria-labelledby="budget-heading">
        <h2
          id="budget-heading"
          className="font-heading text-lg uppercase tracking-wider text-foreground mb-4 flex items-center gap-2"
        >
          <Banknote className="h-5 w-5" style={{ color: MODULE_COLOR }} aria-hidden />
          Budget
        </h2>
        {budgetItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No budget items yet.</p>
        ) : (
          <>
            {/* Per-category table — User Autonomy: always show the workings */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm" data-testid="budget-table">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Planned</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actual</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetSummary.categories.map((cat) => (
                    <tr key={cat.category} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 text-foreground">{CATEGORY_LABELS[cat.category] ?? cat.category}</td>
                      <td className="px-4 py-2 text-right text-foreground">{fmt(cat.planned, trip.currency)}</td>
                      <td className="px-4 py-2 text-right text-foreground">{fmt(cat.actual, trip.currency)}</td>
                      <td
                        className={`px-4 py-2 text-right ${cat.difference > 0 ? 'text-destructive' : 'text-foreground'}`}
                      >
                        {cat.difference > 0 ? '+' : ''}{fmt(cat.difference, trip.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 font-medium">
                    <td className="px-4 py-2 text-foreground">Total</td>
                    <td className="px-4 py-2 text-right text-foreground">{fmt(budgetSummary.totalPlanned, trip.currency)}</td>
                    <td className="px-4 py-2 text-right text-foreground">{fmt(budgetSummary.totalActual, trip.currency)}</td>
                    <td
                      className={`px-4 py-2 text-right ${budgetSummary.totalDifference > 0 ? 'text-destructive' : 'text-foreground'}`}
                    >
                      {budgetSummary.totalDifference > 0 ? '+' : ''}{fmt(budgetSummary.totalDifference, trip.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Packing list */}
      <section aria-labelledby="packing-heading">
        <h2
          id="packing-heading"
          className="font-heading text-lg uppercase tracking-wider text-foreground mb-4 flex items-center gap-2"
        >
          <Package className="h-5 w-5" style={{ color: MODULE_COLOR }} aria-hidden />
          Packing list
          {packingItems.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {packedCount} / {packingItems.length} packed
            </span>
          )}
        </h2>
        {packingItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No packing items yet.</p>
        ) : (
          <ul className="space-y-2" data-testid="packing-list">
            {packingItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                data-testid={`packing-item-${item.id}`}
              >
                <span
                  className={`h-4 w-4 shrink-0 rounded border-2 ${item.is_packed ? 'bg-green-500 border-green-500' : 'border-border'}`}
                  aria-label={item.is_packed ? 'Packed' : 'Not packed'}
                />
                <span
                  className={`flex-1 text-sm ${item.is_packed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                >
                  {item.name}
                </span>
                {item.category && (
                  <span className="text-xs text-muted-foreground">{item.category}</span>
                )}
                <span className="text-xs text-muted-foreground capitalize">{item.assignee}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
