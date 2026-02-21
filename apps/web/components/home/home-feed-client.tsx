'use client';

import { format, isToday, isYesterday } from 'date-fns';
import { FeedItem } from './feed-item';
import { SmartCard } from './smart-card';
import type { ActivityFeed } from '@repo/supabase';

interface HomeFeedClientProps {
  userId: string;
  partnerName: string | null;
  unreadNotifications: { id: string; title: string; body: string | null; action_url: string | null; created_at: string }[];
  activityFeed: ActivityFeed[];
  unpaidSeedsCount: number;
  paydayRitualReady: boolean;
  activePaycycleId: string | null;
}

function groupByDay(items: ActivityFeed[]): { label: string; items: ActivityFeed[] }[] {
  const groups: { label: string; items: ActivityFeed[] }[] = [];
  let currentLabel = '';
  let currentItems: ActivityFeed[] = [];

  for (const item of items) {
    const d = new Date(item.created_at);
    const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'EEEE, MMM d');
    if (label !== currentLabel) {
      if (currentItems.length > 0) {
        groups.push({ label: currentLabel, items: currentItems });
      }
      currentLabel = label;
      currentItems = [item];
    } else {
      currentItems.push(item);
    }
  }
  if (currentItems.length > 0) {
    groups.push({ label: currentLabel, items: currentItems });
  }
  return groups;
}

export function HomeFeedClient({
  userId,
  partnerName,
  activityFeed,
  unpaidSeedsCount,
  paydayRitualReady,
  activePaycycleId,
}: HomeFeedClientProps) {
  const grouped = groupByDay(activityFeed);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-6">
        <header>
          <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-foreground">
            Home
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Activity and quick actions
          </p>
        </header>

        <section>
          <h2 className="font-heading mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Quick actions
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            <div className="w-[280px] shrink-0">
              <SmartCard
                title="Weekly Reset"
                description="Sort out the week ahead"
                moduleId="tasks"
                href="/dashboard/tasks/weekly-reset"
              />
            </div>
            <div className="w-[280px] shrink-0">
              <SmartCard
                title="Tasks"
                description="Add and manage tasks"
                moduleId="tasks"
                href="/dashboard/tasks"
              />
            </div>
            <div className="w-[280px] shrink-0">
              <SmartCard
                title="Calendar"
                description="View and add events"
                moduleId="calendar"
                href="/dashboard/calendar"
              />
            </div>
            {unpaidSeedsCount > 0 && (
              <div className="w-[280px] shrink-0">
                <SmartCard
                  title={`${unpaidSeedsCount} unpaid bill${unpaidSeedsCount === 1 ? '' : 's'}`}
                  description="Mark bills paid in Blueprint"
                  moduleId="money"
                  href="/dashboard/money/blueprint"
                />
              </div>
            )}
            {paydayRitualReady && activePaycycleId && (
              <div className="w-[280px] shrink-0">
                <SmartCard
                  title="Payday Ritual ready"
                  description="Open your ritual to allocate this cycle"
                  moduleId="money"
                  href={`/dashboard/money/blueprint?cycle=${activePaycycleId}`}
                />
              </div>
            )}
          </div>
        </section>

        <section aria-label="Recent updates">
          <h2 className="font-heading mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recent updates
          </h2>
          {grouped.length === 0 ? (
            <p className="rounded-lg border border-border/50 bg-card p-6 text-center text-sm text-muted-foreground">
              No activity yet. Your updates will appear here after you use Money, Tasks, or other modules.
            </p>
          ) : (
            <div className="space-y-6">
              {grouped.map(({ label, items }) => (
                <div key={label}>
                  <p className="font-heading mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  <ul className="space-y-1 rounded-lg border border-border/50 bg-card overflow-hidden">
                    {items.map((item) => (
                      <li key={item.id}>
                        <FeedItem
                          item={item}
                          currentUserId={userId}
                          partnerName={partnerName}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
