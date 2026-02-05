'use client';

import { LogOut, Settings, Moon, Sun, Monitor } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { signOut } from '@/lib/actions/auth-actions';

interface UserMenuProps {
  user: {
    email: string;
    display_name?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const displayName = user.display_name?.trim() || user.email;
  const initials = user.display_name?.trim()
    ? user.display_name.charAt(0).toUpperCase()
    : user.email.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("You've been logged out");
      router.push('/login');
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
          >
            <Settings className="mr-2 h-4 w-4" aria-hidden />
            Settings
          </Link>
        </DropdownMenuItem>
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
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer transition-colors duration-200 focus:bg-destructive/10 focus:text-destructive"
          onSelect={handleSignOut}
          aria-label="Log out"
          data-testid="user-menu-logout"
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
