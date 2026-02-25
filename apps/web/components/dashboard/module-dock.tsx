'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, Calendar as CalendarIcon, CheckSquare, GripVertical, PoundSterling, UtensilsCrossed, Plane, MoreHorizontal, X } from 'lucide-react';
import { getModule } from '@repo/logic';
import { cn } from '@repo/ui';
import type { ModuleFlags } from '@/lib/module-flags';

interface ModuleDockProps {
  moduleFlags: ModuleFlags;
}

function isCurrent(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

/** Max scale at cursor (macOS-style). Closest icon scales to this. */
const DOCK_MAGNIFY_MAX = 1.35;
/** Distance (px) from icon center at which scale falls off to 1. */
const DOCK_MAGNIFY_RADIUS = 72;

const DOCK_POSITION_KEY = 'plot-dock-position';
const DOCK_MARGIN = 8;

function loadDockPosition(): { bottom: number; left: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DOCK_POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { bottom: number; left: number };
    if (typeof parsed?.bottom === 'number' && typeof parsed?.left === 'number') return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

function saveDockPosition(position: { bottom: number; left: number }) {
  try {
    localStorage.setItem(DOCK_POSITION_KEY, JSON.stringify(position));
  } catch {
    /* ignore */
  }
}

function clampDockPosition(
  left: number,
  bottom: number,
  dockWidth: number,
  dockHeight: number
): { left: number; bottom: number } {
  return {
    left: Math.max(DOCK_MARGIN, Math.min(window.innerWidth - dockWidth - DOCK_MARGIN, left)),
    bottom: Math.max(DOCK_MARGIN, Math.min(window.innerHeight - dockHeight - DOCK_MARGIN, bottom)),
  };
}

function useMatchMedia(query: string, defaultValue: boolean): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {};
      const mq = window.matchMedia(query);
      const handler = () => onStoreChange();
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    },
    () => (typeof window === 'undefined' ? defaultValue : window.matchMedia(query).matches),
    () => defaultValue
  );
}

/**
 * macOS-style floating dock: Home + enabled modules. Desktop: magnification on hover (icons scale
 * by proximity to pointer). Mobile: no magnification (no hover); equal touch targets, clear active state.
 * Respects prefers-reduced-motion. Replaces top-bar "Go to" so module switching is one-tap.
 */
export function ModuleDock({ moduleFlags }: ModuleDockProps) {
  const pathname = usePathname();
  const dockRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastXRef = useRef<number | null>(null);

  const [scales, setScales] = useState<number[]>([]);
  const prefersReducedMotion = useMatchMedia('(prefers-reduced-motion: reduce)', false);
  const hasHover = useMatchMedia('(hover: hover)', false);
  const magnifyEnabled = hasHover && !prefersReducedMotion;
  const [position, setPosition] = useState<{ bottom: number; left: number } | null>(() => {
    if (typeof window === 'undefined') return null;
    return loadDockPosition();
  });
  const dragStartRef = useRef<{ x: number; y: number; left: number; bottom: number } | null>(null);
  const dragHandleRef = useRef<HTMLDivElement | null>(null);

  const items: { href: string; label: string; icon: React.ElementType; shortLabel?: string }[] = [
    { href: '/dashboard', label: 'Home', shortLabel: 'Home', icon: Home },
    ...(moduleFlags.money ? [{ href: '/dashboard/money', label: getModule('money').name, shortLabel: 'Money', icon: PoundSterling }] : []),
    ...(moduleFlags.tasks ? [{ href: '/dashboard/tasks', label: getModule('tasks').name, shortLabel: 'Tasks', icon: CheckSquare }] : []),
    ...(moduleFlags.calendar ? [{ href: '/dashboard/calendar', label: getModule('calendar').name, shortLabel: 'Calendar', icon: CalendarIcon }] : []),
    ...(moduleFlags.meals ? [{ href: '/dashboard/meals', label: getModule('meals').name, shortLabel: 'Meals', icon: UtensilsCrossed }] : []),
    ...(moduleFlags.holidays ? [{ href: '/dashboard/holidays', label: getModule('holidays').name, shortLabel: 'Holidays', icon: Plane }] : []),
    ...(moduleFlags.home ? [{ href: '/dashboard/home', label: getModule('home').name, shortLabel: 'Feed', icon: ClipboardList }] : []),
  ].filter(Boolean) as { href: string; label: string; icon: React.ElementType; shortLabel?: string }[];

  /** Maximum number of items to show in the mobile tab bar before overflowing to "More". */
  const MOBILE_MAX_VISIBLE = 4;

  const [moreOpen, setMoreOpen] = useState(false);

  /**
   * On mobile, compute which items appear in the fixed bar.
   * When there are more than MOBILE_MAX_VISIBLE items (e.g. 5+), the active
   * item is always kept visible; remaining slots are filled from the front.
   */
  const { mobileVisible, mobileOverflow } = useMemo(() => {
    if (hasHover || items.length <= MOBILE_MAX_VISIBLE) {
      return { mobileVisible: items, mobileOverflow: [] };
    }
    const activeIdx = items.findIndex((item) => isCurrent(pathname, item.href));
    // Build the visible set: Home (index 0) first, then active item, then fill in order.
    // Using an insertion-ordered array + Set to deduplicate while preserving priority.
    const prioritised: number[] = [];
    const seen = new Set<number>();
    const enqueue = (i: number) => {
      if (i >= 0 && i < items.length && !seen.has(i)) {
        seen.add(i);
        prioritised.push(i);
      }
    };
    enqueue(0);          // Home is always first priority
    enqueue(activeIdx);  // Active item is always kept visible
    for (let i = 1; i < items.length; i++) enqueue(i); // fill rest in order
    // Take only MOBILE_MAX_VISIBLE and re-sort to original index order
    const visibleSet = new Set(prioritised.slice(0, MOBILE_MAX_VISIBLE));
    return {
      mobileVisible: items.filter((_, i) => visibleSet.has(i)),
      mobileOverflow: items.filter((_, i) => !visibleSet.has(i)),
    };
  }, [hasHover, items, pathname]);

  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      if (!hasHover || !dockRef.current) return;
      e.preventDefault();
      const rect = dockRef.current.getBoundingClientRect();
      const currentLeft = position ? position.left : window.innerWidth / 2 - rect.width / 2;
      const currentBottom = position ? position.bottom : window.innerHeight - rect.bottom;
      dragStartRef.current = { x: e.clientX, y: e.clientY, left: currentLeft, bottom: currentBottom };
      dragHandleRef.current?.setPointerCapture(e.pointerId);
    },
    [hasHover, position]
  );

  const handleDragMove = useCallback((e: PointerEvent) => {
    const start = dragStartRef.current;
    if (!start || !dockRef.current) return;
    const rect = dockRef.current.getBoundingClientRect();
    const deltaX = e.clientX - start.x;
    const deltaY = e.clientY - start.y;
    const newLeft = start.left + deltaX;
    const newBottom = start.bottom - deltaY;
    const clamped = clampDockPosition(newLeft, newBottom, rect.width, rect.height);
    setPosition(clamped);
  }, []);

  const handleDragEnd = useCallback((e: PointerEvent) => {
    if (!dragStartRef.current) return;
    dragHandleRef.current?.releasePointerCapture?.(e.pointerId);
    dragStartRef.current = null;
    const rect = dockRef.current?.getBoundingClientRect();
    if (rect) {
      const currentLeft = rect.left;
      const currentBottom = window.innerHeight - rect.bottom;
      const clamped = clampDockPosition(currentLeft, currentBottom, rect.width, rect.height);
      saveDockPosition(clamped);
      setPosition(clamped);
    }
  }, []);

  useEffect(() => {
    if (!hasHover) return;
    const onPointerUp = (e: PointerEvent) => {
      if (dragStartRef.current) handleDragEnd(e);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (dragStartRef.current) handleDragMove(e);
    };
    window.addEventListener('pointerup', onPointerUp, true);
    window.addEventListener('pointermove', onPointerMove, true);
    return () => {
      window.removeEventListener('pointerup', onPointerUp, true);
      window.removeEventListener('pointermove', onPointerMove, true);
    };
  }, [hasHover, handleDragEnd, handleDragMove]);

  // Close the "More" sheet on Escape key
  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moreOpen]);

  const updateScales = useCallback(
    (clientX: number | null) => {
      if (!magnifyEnabled || items.length === 0) {
        setScales(items.map(() => 1));
        return;
      }
      if (clientX === null) {
        setScales(items.map(() => 1));
        return;
      }
      const newScales = itemRefs.current.slice(0, items.length).map((el) => {
        if (!el) return 1;
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const distance = Math.abs(clientX - centerX);
        if (distance >= DOCK_MAGNIFY_RADIUS) return 1;
        const t = 1 - distance / DOCK_MAGNIFY_RADIUS;
        return 1 + (DOCK_MAGNIFY_MAX - 1) * t;
      });
      setScales(newScales);
    },
    [items, magnifyEnabled]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      lastXRef.current = e.clientX;
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (lastXRef.current !== null) updateScales(lastXRef.current);
      });
    },
    [updateScales]
  );

  const handlePointerLeave = useCallback(() => {
    lastXRef.current = null;
    updateScales(null);
  }, [updateScales]);

  if (items.length === 0) return null;

  const scaleArray = !magnifyEnabled
    ? items.map(() => 1)
    : scales.length === items.length
      ? scales
      : items.map(() => 1);

  /** Items actually rendered in the bar — full list on desktop, capped set on mobile. */
  const visibleItems = hasHover ? items : mobileVisible;

  return (
    <>
      <nav
        className={cn(
          'fixed z-40 flex justify-center px-3 pt-4',
          !hasHover && 'bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom,0)]',
          hasHover && !position && 'left-1/2 -translate-x-1/2 bottom-6 md:pb-4',
          hasHover && 'w-max'
        )}
        style={
          hasHover && position
            ? { left: position.left, bottom: position.bottom }
            : undefined
        }
        aria-label="Switch module"
      >
        <div
          ref={dockRef}
          onPointerMove={magnifyEnabled ? handlePointerMove : undefined}
          onPointerLeave={magnifyEnabled ? handlePointerLeave : undefined}
          className={cn(
            'flex items-center justify-center gap-1 rounded-2xl border border-border bg-card/95 px-2 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/90',
            'md:gap-2 md:rounded-3xl md:px-4 md:py-2.5'
          )}
        >
          {hasHover && (
            <div
              ref={dragHandleRef}
              role="button"
              tabIndex={0}
              aria-label="Drag to reposition dock"
              onPointerDown={handleDragStart}
              className="cursor-grab active:cursor-grabbing touch-none rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <GripVertical className="h-5 w-5" aria-hidden />
            </div>
          )}
          {visibleItems.map(({ href, label, shortLabel, icon: Icon }, i) => {
            const current = isCurrent(pathname, href);
            // Magnification only applies on desktop (hasHover); on mobile scale is always 1.
            const scale = scaleArray[i] ?? 1;
            return (
              <Link
                key={href}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl p-2.5 transition-transform duration-150 ease-out min-w-[2.75rem] md:min-w-[3rem]',
                  'touch-manipulation',
                  current
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
                style={
                  magnifyEnabled && scale !== 1
                    ? { transform: `scale(${scale})`, transformOrigin: 'center bottom' }
                    : undefined
                }
                aria-current={current ? 'page' : undefined}
                title={label}
              >
                <Icon className="h-6 w-6 md:h-7 md:w-7 shrink-0" aria-hidden />
                <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider md:text-xs">
                  {shortLabel ?? label}
                </span>
              </Link>
            );
          })}
          {/* "More" button — only on mobile when there are overflow items */}
          {!hasHover && mobileOverflow.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              aria-label="More modules"
              className={cn(
                'flex flex-col items-center justify-center rounded-xl p-2.5 min-w-[2.75rem]',
                'touch-manipulation text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <MoreHorizontal className="h-6 w-6 shrink-0" aria-hidden />
              <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* Bottom-sheet overlay for overflow modules on mobile */}
      {!hasHover && moreOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="All modules"
        >
          {/* Backdrop — fade in */}
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
            onClick={() => setMoreOpen(false)}
            aria-hidden
          />
          {/* Sheet — slide up from bottom */}
          <div className="relative rounded-t-2xl border-t border-border bg-card pb-[env(safe-area-inset-bottom,0)] shadow-xl animate-in slide-in-from-bottom duration-250 ease-out">
            {/* Drag handle affordance */}
            <div className="flex justify-center pt-3 pb-1" aria-hidden>
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="flex items-center justify-between px-4 pt-1 pb-3">
              <span className="font-heading text-sm uppercase tracking-wider text-foreground">
                All modules
              </span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close"
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {/* List layout — full-width rows, scannable like Linear/Notion */}
            <nav aria-label="All modules" className="flex flex-col px-2 pb-3">
              {items.map(({ href, label, icon: Icon }) => {
                const current = isCurrent(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 min-h-[3.25rem] transition-colors touch-manipulation',
                      current
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                    aria-current={current ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="flex-1 text-sm font-medium">{label}</span>
                    {current && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
