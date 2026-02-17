'use client';

import { useEffect, useMemo, useState } from 'react';
import { LogOut, Settings, Moon, Sun, Monitor, HelpCircle, MessageSquare, CreditCard, FlaskConical } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { getAppBaseUrl } from '@/lib/app-url';
import { useAuthFeatureFlags } from '@/hooks/use-auth-feature-flags';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut, leavePartnerSession } from '@/lib/actions/auth-actions';

import { getAvatarInitials } from '@/lib/utils/avatar-initials';
import { useNavigationProgress } from '@/components/navigation/navigation-progress-context';

interface UserMenuProps {
  user: {
    id?: string;
    email: string;
    display_name?: string | null;
    avatar_url?: string | null;
  };
  isPartner?: boolean;
  trialTestingDashboardVisible?: boolean;
}

export function UserMenu({ user, isPartner = false, trialTestingDashboardVisible = false }: UserMenuProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { paymentUiVisible } = useAuthFeatureFlags();
  const { setNavigating } = useNavigationProgress();
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!user.id) return;
    const channel = supabase
      .channel('user-avatar-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newUrl = (payload.new as { avatar_url?: string | null })?.avatar_url;
          if (newUrl != null) setAvatarUrl(newUrl);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, supabase]);

  const displayName = user.display_name?.trim() || user.email;
  const initials = getAvatarInitials(user.display_name ?? null, user.email);

  const handleSignOut = async () => {
    try {
      if (isPartner) {
        await leavePartnerSession();
        return;
      }
      await signOut();
      toast.success("You've been logged out");
      window.location.href = `${getAppBaseUrl()}/`;
    } catch {
      toast.error('Failed to log out');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 text-primary transition-colors duration-200 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="User menu"
          aria-haspopup="menu"
          data-testid="user-menu-trigger"
        >
          <Avatar className="h-8 w-8 rounded-full border-0">
            {avatarUrl ? (
              <AvatarImage
                src={avatarUrl}
                alt=""
                className="avatar-pixelated object-cover"
              />
            ) : null}
            <AvatarFallback
              className="bg-transparent text-primary font-display text-sm"
              aria-hidden
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-[12rem] rounded-lg border-border p-1"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            {isPartner && (
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Viewing as partner
              </p>
            )}
            <p className="font-heading text-sm font-medium uppercase tracking-wider text-foreground">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground normal-case">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          className="cursor-pointer transition-colors duration-200"
        >
          <Link
            href="/dashboard/settings"
            className="flex items-center focus:bg-primary/10 focus:text-primary"
            data-testid="user-menu-settings"
            onClick={() => setNavigating(true)}
          >
            <Settings className="mr-2 h-4 w-4" aria-hidden />
            Settings
          </Link>
        </DropdownMenuItem>
        {paymentUiVisible && (
          <DropdownMenuItem
            asChild
            className="cursor-pointer transition-colors duration-200"
          >
            <Link
              href="/pricing"
              className="flex items-center focus:bg-primary/10 focus:text-primary"
              data-testid="user-menu-pricing"
              onClick={() => setNavigating(true)}
            >
              <CreditCard className="mr-2 h-4 w-4" aria-hidden />
              Pricing
            </Link>
          </DropdownMenuItem>
        )}
        {trialTestingDashboardVisible && (
          <DropdownMenuItem
            asChild
            className="cursor-pointer transition-colors duration-200"
          >
            <Link
              href="/dev/trial-testing"
              className="flex items-center focus:bg-primary/10 focus:text-primary"
              data-testid="user-menu-trial-testing"
              onClick={() => setNavigating(true)}
            >
              <FlaskConical className="mr-2 h-4 w-4" aria-hidden />
              Dev: Trial Testing
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            className="transition-colors duration-200"
            aria-label="Theme"
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="mr-2 h-4 w-4" aria-hidden />
            ) : resolvedTheme === 'light' ? (
              <Sun className="mr-2 h-4 w-4" aria-hidden />
            ) : (
              <Monitor className="mr-2 h-4 w-4" aria-hidden />
            )}
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="rounded-lg border-border">
            <DropdownMenuRadioGroup
              value={theme ?? 'system'}
              onValueChange={(value) => setTheme(value)}
            >
              <DropdownMenuRadioItem
                value="light"
                className="cursor-pointer transition-colors duration-200"
              >
                <Sun className="mr-2 h-4 w-4" aria-hidden />
                Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="dark"
                className="cursor-pointer transition-colors duration-200"
              >
                <Moon className="mr-2 h-4 w-4" aria-hidden />
                Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="system"
                className="cursor-pointer transition-colors duration-200"
              >
                <Monitor className="mr-2 h-4 w-4" aria-hidden />
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem
          asChild
          className="cursor-pointer transition-colors duration-200"
        >
          <Link
            href="/dashboard/feedback"
            className="flex items-center focus:bg-primary/10 focus:text-primary"
            data-testid="user-menu-feedback"
            onClick={() => setNavigating(true)}
          >
            <MessageSquare className="mr-2 h-4 w-4" aria-hidden />
            Feedback & bugs
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          className="cursor-pointer transition-colors duration-200"
        >
          <a
            href="mailto:hello@plotbudget.com"
            className="flex items-center focus:bg-primary/10 focus:text-primary"
          >
            <HelpCircle className="mr-2 h-4 w-4" aria-hidden />
            Help
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer transition-colors duration-200 focus:bg-destructive/10 focus:text-destructive"
          onSelect={handleSignOut}
          aria-label={isPartner ? 'Leave' : 'Log out'}
          data-testid="user-menu-logout"
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden />
          {isPartner ? 'Leave' : 'Log out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
