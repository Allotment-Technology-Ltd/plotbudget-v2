import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Banknote, Package, List, LayoutDashboard } from 'lucide-react';
import { getCachedDashboardAuth, getCachedSupabase } from '@/lib/auth/server-auth-cache';
import { getModule, calculateTripBudget } from '@repo/logic';
import type { Trip, ItineraryEntry, TripBudgetItem, PackingItem } from '@repo/supabase';

import { AddItineraryDialog } from '@/components/holidays/add-itinerary-dialog';
import { AddBudgetDialog } from '@/components/holidays/add-budget-dialog';
import { AddPackingDialog } from '@/components/holidays/add-packing-dialog';
import { DeleteTripButton } from '@/components/holidays/delete-trip-button';
import { ItineraryTemplateDialog } from '@/components/holidays/itinerary-template-dialog';
import { BudgetTemplateDialog } from '@/components/holidays/budget-template-dialog';
import { PackingTemplateDialog } from '@/components/holidays/packing-template-dialog';
import { EditItineraryEntryDialog } from '@/components/holidays/edit-itinerary-entry-dialog';
import { EditBudgetItemDialog } from '@/components/holidays/edit-budget-item-dialog';
import { EditPackingItemDialog } from '@/components/holidays/edit-packing-item-dialog';
import { DeleteItemButton } from '@/components/holidays/delete-item-button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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

  const { data: trip } = tripResult as { data: Trip };
  const { data: itineraryRaw } = itineraryResult as { data: ItineraryEntry[] | null };
  const { data: budgetRaw } = budgetResult as { data: TripBudgetItem[] | null };
  const { data: packingRaw } = packingResult as { data: PackingItem[] | null };
  const itinerary = itineraryRaw ?? [];
  const budgetItems = budgetRaw ?? [];
  const packingItems = packingRaw ?? [];

  const budgetSummary = calculateTripBudget(
    budgetItems.map((b) => ({
      category: b.category,
      planned_amount: b.planned_amount,
      actual_amount: b.actual_amount,
    }))
  );

  const packedCount = packingItems.filter((p) => p.is_packed).length;

  // Calculate days until trip
  const today = new Date();
  const startDate = new Date(trip.start_date);
  const daysUntilTrip = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Get next itinerary entry
  const nextEntry = itinerary.find((entry) => new Date(entry.date) >= today);

  return (
    <div className="content-wrapper py-8" data-testid="trip-detail-page">
      {/* Back link */}
      <Link
        href="/dashboard/holidays"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 min-h-[2.75rem]"
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
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-2xl uppercase tracking-widest text-foreground mb-1">
              {trip.name}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {trip.destination}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4 shrink-0" aria-hidden />
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
          <div className="shrink-0">
            <DeleteTripButton trip={trip} />
          </div>
        </div>
      </div>

      {/* Tabbed Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        {/* -mx-4 sm:mx-0 makes the tab strip bleed to screen edges on mobile so there is no clipping */}
        <div className="-mx-4 sm:mx-0 px-4 sm:px-0">
          <TabsList className="w-full">
            <TabsTrigger value="overview">
              <LayoutDashboard className="h-4 w-4 mr-1.5 shrink-0 hidden sm:inline-block" aria-hidden />
              Overview
            </TabsTrigger>
            <TabsTrigger value="itinerary">
              <List className="h-4 w-4 mr-1.5 shrink-0 hidden sm:inline-block" aria-hidden />
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="budget">
              <Banknote className="h-4 w-4 mr-1.5 shrink-0 hidden sm:inline-block" aria-hidden />
              Budget
            </TabsTrigger>
            <TabsTrigger value="packing">
              <Package className="h-4 w-4 mr-1.5 shrink-0 hidden sm:inline-block" aria-hidden />
              Packing
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Countdown Card */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="text-sm text-muted-foreground mb-1">
                  {daysUntilTrip > 0 ? 'Days until trip' : daysUntilTrip === 0 ? 'Today!' : 'Completed'}
                </div>
                <div className="text-3xl font-heading text-foreground">
                  {daysUntilTrip > 0 ? daysUntilTrip : daysUntilTrip === 0 ? '🎉' : '✓'}
                </div>
              </div>

              {/* Budget Summary Card */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="text-sm text-muted-foreground mb-1">Total budget</div>
                <div className="text-2xl font-heading text-foreground">
                  {fmt(budgetSummary.totalPlanned, trip.currency)}
                </div>
                {budgetSummary.totalActual > 0 && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Spent: {fmt(budgetSummary.totalActual, trip.currency)}
                  </div>
                )}
              </div>

              {/* Packing Progress Card */}
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="text-sm text-muted-foreground mb-1">Packing progress</div>
                <div className="text-2xl font-heading text-foreground">
                  {packingItems.length > 0 
                    ? `${Math.round((packedCount / packingItems.length) * 100)}%`
                    : '0%'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {packedCount} of {packingItems.length} items
                </div>
              </div>
            </div>

            {/* Next Up Section */}
            {nextEntry && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-heading text-sm uppercase tracking-wider text-muted-foreground mb-3">
                  Next up
                </h3>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium text-foreground">{nextEntry.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDate(nextEntry.date)}
                      {nextEntry.start_time && ` · ${nextEntry.start_time}`}
                    </div>
                    {nextEntry.description && (
                      <p className="text-sm text-muted-foreground mt-2">{nextEntry.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {ENTRY_TYPE_LABELS[nextEntry.entry_type] ?? nextEntry.entry_type}
                  </span>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-heading text-sm uppercase tracking-wider text-muted-foreground mb-4">
                Trip summary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Itinerary entries</span>
                  <span className="text-foreground font-medium">{itinerary.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget items</span>
                  <span className="text-foreground font-medium">{budgetItems.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Packing items</span>
                  <span className="text-foreground font-medium">{packingItems.length}</span>
                </div>
                {budgetSummary.totalDifference !== 0 && (
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-border">
                    <span className="text-muted-foreground">Budget variance</span>
                    <span className={budgetSummary.totalDifference > 0 ? 'text-destructive font-medium' : 'text-foreground font-medium'}>
                      {budgetSummary.totalDifference > 0 ? '+' : ''}
                      {fmt(budgetSummary.totalDifference, trip.currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Itinerary Tab */}
        <TabsContent value="itinerary">
          <section aria-labelledby="itinerary-heading">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2
                id="itinerary-heading"
                className="font-heading text-lg uppercase tracking-wider text-foreground flex items-center gap-2"
              >
                <List className="h-5 w-5 shrink-0" style={{ color: MODULE_COLOR }} aria-hidden />
                Itinerary
              </h2>
              <div className="flex items-center gap-2">
                {itinerary.length === 0 && <ItineraryTemplateDialog trip={trip} />}
                <AddItineraryDialog trip={trip} />
              </div>
            </div>
            {itinerary.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                No itinerary entries yet — add your first entry or choose from a template.
              </p>
            ) : (
              <ol className="space-y-3">
                {itinerary.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-border bg-card p-4"
                    data-testid={`itinerary-entry-${entry.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="font-medium text-foreground">{entry.title}</span>
                        {entry.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">{entry.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="shrink-0 text-xs text-muted-foreground mr-2">
                          {ENTRY_TYPE_LABELS[entry.entry_type] ?? entry.entry_type}
                        </span>
                        <EditItineraryEntryDialog entry={entry} tripId={trip.id} />
                        <DeleteItemButton 
                          itemId={entry.id} 
                          tripId={trip.id} 
                          itemType="itinerary" 
                          itemName={entry.title} 
                        />
                      </div>
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
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget">
          <section aria-labelledby="budget-heading">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2
                id="budget-heading"
                className="font-heading text-lg uppercase tracking-wider text-foreground flex items-center gap-2"
              >
                <Banknote className="h-5 w-5 shrink-0" style={{ color: MODULE_COLOR }} aria-hidden />
                Budget
              </h2>
              <div className="flex items-center gap-2">
                {budgetItems.length === 0 && <BudgetTemplateDialog trip={trip} />}
                <AddBudgetDialog trip={trip} />
              </div>
            </div>
            {budgetItems.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                No budget items yet — add your first item or choose from a template.
              </p>
            ) : (
              <>
                {/* Budget items list */}
                <div className="space-y-3 mb-4">
                  {budgetItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border bg-card p-4"
                      data-testid={`budget-item-${item.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <span className="font-medium text-foreground">{item.name}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {CATEGORY_LABELS[item.category] ?? item.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <EditBudgetItemDialog item={item} tripId={trip.id} />
                          <DeleteItemButton 
                            itemId={item.id} 
                            tripId={trip.id} 
                            itemType="budget" 
                            itemName={item.name} 
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm">
                        {item.planned_amount != null && (
                          <span className="text-muted-foreground">
                            Planned: <span className="text-foreground">{fmt(item.planned_amount, trip.currency)}</span>
                          </span>
                        )}
                        {item.actual_amount != null && (
                          <span className="text-muted-foreground">
                            Actual: <span className="text-foreground">{fmt(item.actual_amount, trip.currency)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary table */}
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
        </TabsContent>

        {/* Packing Tab */}
        <TabsContent value="packing">
          <section aria-labelledby="packing-heading">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2
                id="packing-heading"
                className="font-heading text-lg uppercase tracking-wider text-foreground flex items-center gap-2"
              >
                <Package className="h-5 w-5 shrink-0" style={{ color: MODULE_COLOR }} aria-hidden />
                Packing list
                {packingItems.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {packedCount} / {packingItems.length} packed
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                {packingItems.length === 0 && <PackingTemplateDialog trip={trip} />}
                <AddPackingDialog trip={trip} />
              </div>
            </div>
            {packingItems.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                No packing items yet — add your first item or choose from a template.
              </p>
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
                      role="checkbox"
                      aria-checked={item.is_packed}
                      aria-readonly="true"
                    />
                    <span
                      className={`flex-1 text-sm ${item.is_packed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                    >
                      {item.name}
                    </span>
                    {item.category && (
                      <span className="text-xs text-muted-foreground">{item.category}</span>
                    )}
                    <div className="flex items-center gap-1">
                      <EditPackingItemDialog item={item} tripId={trip.id} />
                      <DeleteItemButton 
                        itemId={item.id} 
                        tripId={trip.id} 
                        itemType="packing" 
                        itemName={item.name} 
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
