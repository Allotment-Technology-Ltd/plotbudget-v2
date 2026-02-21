'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityFeed } from '@repo/supabase';

interface FeedItemProps {
  item: ActivityFeed;
  currentUserId: string;
  partnerName: string | null;
}

function avatarBg(actorType: 'user' | 'partner' | 'system', isCurrentUser: boolean): string {
  if (actorType === 'system') return 'bg-muted';
  if (isCurrentUser) return 'bg-primary text-primary-foreground';
  return 'bg-[#C78D75] text-white';
}

function avatarInitial(actorType: 'user' | 'partner' | 'system', partnerName: string | null): string {
  if (actorType === 'user') return 'Y';
  if (actorType === 'partner') return partnerName?.trim().charAt(0).toUpperCase() ?? 'P';
  return '•';
}

export function FeedItem({ item, currentUserId, partnerName }: FeedItemProps) {
  const isCurrentUser = item.actor_user_id === currentUserId;
  const displayName =
    item.actor_type === 'user'
      ? 'You'
      : item.actor_type === 'partner'
        ? partnerName ?? 'Partner'
        : 'PLOT';

  const content = (
    <>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${avatarBg(item.actor_type, isCurrentUser)}`}
        aria-hidden
      >
        {avatarInitial(item.actor_type, partnerName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          <span className="font-medium">{displayName}</span>
          {' '}
          <span className="text-muted-foreground">{item.action}</span>
          {' '}
          <span className="font-medium">{item.object_name}</span>
          {item.object_detail ? (
            <span className="text-muted-foreground"> — {item.object_detail}</span>
          ) : null}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          {item.actor_type === 'system' ? ` · ${item.source_module}` : ''}
        </p>
      </div>
    </>
  );

  const className =
    'flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  if (item.action_url && item.action_url.startsWith('/')) {
    return (
      <Link href={item.action_url} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
