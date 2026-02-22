'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@repo/ui';

export interface ModuleNavSubLink {
  href: string;
  label: string;
  icon: LucideIcon;
  isCurrent?: boolean;
  title?: string;
}

interface ModuleNavDropdownProps {
  /** Module display name (e.g. "Meals & shopping", "Money"). */
  label: string;
  /** Icon shown next to the module name. */
  icon: LucideIcon;
  /** Link when clicking the module name (e.g. module hub). */
  moduleHref: string;
  /** Sub-pages shown in the dropdown, directly under the module name. */
  subLinks: ModuleNavSubLink[];
  /** Whether any sub-page is current (styles trigger as active). */
  isModuleActive: boolean;
  /** For aria-label on the trigger. */
  ariaLabel: string;
  /** Optional title on the trigger. */
  triggerTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ref for click-outside (parent passes the wrapper ref). */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Reusable module nav: one trigger (module name + icon + chevron) with a dropdown
 * positioned directly under it. Sub-links sit under the module name to save space
 * and work on all screen sizes. Use in the dashboard top bar for Money, Tasks, Meals.
 */
export function ModuleNavDropdown({
  label,
  icon: Icon,
  moduleHref,
  subLinks,
  isModuleActive,
  ariaLabel,
  triggerTitle,
  open,
  onOpenChange,
  containerRef,
}: ModuleNavDropdownProps) {
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [containerRef, onOpenChange]);

  const handleTriggerClick = () => onOpenChange(!open);

  const showHubInMenu = subLinks.length === 0 || subLinks[0]?.href !== moduleHref;

  return (
    <div className="relative flex min-w-0" ref={containerRef as React.RefObject<HTMLDivElement>}>
      <button
        type="button"
        onClick={handleTriggerClick}
        className={cn(
          'group flex min-w-0 flex-1 items-center gap-0 rounded-lg text-left',
          'min-h-[2.75rem] touch-manipulation sm:min-h-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        )}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={ariaLabel}
        title={triggerTitle ?? label}
      >
        <span
          className={cn(
            'flex min-w-0 shrink items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors sm:px-3',
            isModuleActive ? 'bg-muted text-foreground' : 'text-muted-foreground group-hover:bg-muted/50 group-hover:text-foreground'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="min-w-0 truncate" title={label}>
            {label}
          </span>
        </span>
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-lg p-2 text-muted-foreground min-w-[2.75rem] min-h-[2.75rem] sm:min-w-0 sm:min-h-0',
            open && 'bg-muted/50 text-foreground'
          )}
        >
          <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} aria-hidden />
        </span>
      </button>
      {open && (
        <ul
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-[11rem] rounded-lg border border-border bg-card py-1 shadow-lg"
          style={{ width: 'max-content' }}
        >
          {showHubInMenu && (
            <li role="none">
              <Link
                href={moduleHref}
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                onClick={() => onOpenChange(false)}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </Link>
            </li>
          )}
          {subLinks.map(({ href, label: subLabel, icon: SubIcon, isCurrent, title }) => (
            <li key={href} role="none">
              <Link
                href={href}
                role="menuitem"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted',
                  isCurrent ? 'font-medium text-foreground bg-muted/50' : 'text-foreground'
                )}
                onClick={() => onOpenChange(false)}
                title={title ?? subLabel}
              >
                <SubIcon className="h-4 w-4 shrink-0" aria-hidden />
                {subLabel}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
