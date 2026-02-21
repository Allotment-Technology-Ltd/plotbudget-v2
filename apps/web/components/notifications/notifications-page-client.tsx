'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Notification } from '@repo/supabase';

type NotificationItem = Pick<
  Notification,
  'id' | 'title' | 'body' | 'source_module' | 'action_url' | 'is_read' | 'created_at'
>;

interface NotificationsPageClientProps {
  notifications: NotificationItem[];
  userId: string;
}

export function NotificationsPageClient({
  notifications,
  userId: _userId,
}: NotificationsPageClientProps) {
  const router = useRouter();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/mark-all-read', { method: 'PATCH' });
      if (res.ok) router.refresh();
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) router.refresh();
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="content-wrapper section-padding mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide text-foreground">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reminders and updates for your household.
          </p>
        </header>

        {notifications.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" aria-hidden />
            <p className="mt-4 text-sm text-muted-foreground">
              No notifications yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your payday reminder and other updates will appear here.
            </p>
            <Link
              href="/dashboard/home"
              className="mt-6 inline-flex items-center justify-center rounded-md border border-input bg-transparent px-6 py-3 font-heading text-cta uppercase tracking-widest transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <>
            {unreadCount > 0 && (
              <div className="mb-4 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleMarkAllRead}
                  className="gap-2 text-sm text-muted-foreground"
                >
                  <CheckCheck className="h-4 w-4" aria-hidden />
                  Mark all read
                </Button>
              </div>
            )}
            <ul className="space-y-1 rounded-lg border border-border bg-card overflow-hidden">
              {notifications.map((n) => {
                const href = n.action_url ?? '#';
                const content = (
                  <>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-body text-sm ${
                          n.is_read ? 'text-muted-foreground' : 'text-foreground font-medium'
                        }`}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        {n.source_module !== 'money' && (
                          <span className="ml-1"> · {n.source_module}</span>
                        )}
                      </p>
                    </div>
                  </>
                );
                return (
                  <li
                    key={n.id}
                    className={`border-b border-border last:border-b-0 ${
                      !n.is_read ? 'bg-muted/20' : ''
                    }`}
                  >
                    {href !== '#' ? (
                      <Link
                        href={href}
                        onClick={() => !n.is_read && handleMarkRead(n.id)}
                        className="flex gap-3 p-4 hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="flex gap-3 p-4">
                        {content}
                        {!n.is_read && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleMarkRead(n.id)}
                            className="shrink-0 text-sm"
                          >
                            Mark read
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="mt-6">
              <Link
                href="/dashboard/home"
                className="inline-flex items-center justify-center rounded-md border border-input bg-transparent px-6 py-3 font-heading text-cta uppercase tracking-widest transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Back to Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
