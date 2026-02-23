import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plane, Plus } from 'lucide-react';
import { getCachedDashboardAuth, getCachedSupabase } from '@/lib/auth/server-auth-cache';
import { getModule } from '@repo/logic';
import type { Trip } from '@repo/supabase';

export const metadata = {
  title: 'Holidays',
  description: 'Trips and travel planning',
};

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  booked: 'Booked',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${s.toLocaleDateString('en-GB', opts)} – ${e.toLocaleDateString('en-GB', opts)}`;
}

export default async function HolidaysPage() {
  const { user, profile, partnerOf } = await getCachedDashboardAuth();
  if (!user) redirect('/login');
  const householdId = profile?.household_id ?? partnerOf?.id ?? null;
  if (!householdId) redirect('/onboarding');

  const supabase = await getCachedSupabase();
  const { data: trips } = await supabase
    .from('trips')
    .select('id, name, destination, start_date, end_date, status, currency, linked_pot_id, cover_image_url')
    .eq('household_id', householdId)
    .order('start_date', { ascending: false })
    .limit(20);

  const tripList = (trips ?? []) as Trip[];
  const moduleInfo = getModule('holidays');
  const moduleColor = moduleInfo.colorLight;

  return (
    <div className="content-wrapper section-padding" data-testid="holidays-hub">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl uppercase tracking-widest text-foreground mb-1">
            {moduleInfo.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            Plan and track your household trips.
          </p>
        </div>
        <Link
          href="/dashboard/holidays/new"
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ backgroundColor: moduleColor }}
          data-testid="add-trip-button"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add trip
        </Link>
      </div>

      {tripList.length === 0 ? (
        <div
          className="rounded-lg border border-border bg-card p-8 text-center"
          style={{ borderLeftWidth: 4, borderLeftColor: moduleColor }}
        >
          <Plane className="h-10 w-10 mx-auto mb-3" style={{ color: moduleColor }} aria-hidden />
          <p className="text-foreground font-medium mb-1">No trips yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first trip to start planning.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tripList.map((trip) => (
            <Link
              key={trip.id}
              href={`/dashboard/holidays/${trip.id}`}
              className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ borderLeftWidth: 4, borderLeftColor: moduleColor }}
              data-testid={`trip-card-${trip.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-heading text-base uppercase tracking-wider text-foreground line-clamp-1">
                  {trip.name}
                </span>
                <span
                  className="shrink-0 rounded px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: moduleColor }}
                >
                  {STATUS_LABELS[trip.status] ?? trip.status}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{trip.destination}</span>
              <span className="text-xs text-muted-foreground">
                {formatDateRange(trip.start_date, trip.end_date)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
