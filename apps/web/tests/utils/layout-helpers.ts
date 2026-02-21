// apps/web/tests/utils/layout-helpers.ts
// Helpers for automated layout/GUI checks: overflow, viewport bounds, alignment.
// Use with mobile viewport to catch cards or text going off-screen.

import type { Page } from '@playwright/test';

/** Allow 1px tolerance for subpixel rounding. */
const TOLERANCE_PX = 1;

/**
 * Asserts the page has no horizontal overflow (nothing forcing a horizontal scrollbar).
 * Fails if document width exceeds viewport width — catches content "going over the edge".
 */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const { docWidth, viewportWidth, overflow } = await page.evaluate(() => {
    const vw = window.innerWidth;
    const doc = document.documentElement;
    const docWidth = Math.max(doc.scrollWidth, doc.clientWidth, document.body?.scrollWidth ?? 0, document.body?.clientWidth ?? 0);
    return {
      docWidth,
      viewportWidth: vw,
      overflow: docWidth > vw ? docWidth - vw : 0,
    };
  });
  if (overflow > TOLERANCE_PX) {
    throw new Error(
      `Horizontal overflow detected: document width ${docWidth}px exceeds viewport ${viewportWidth}px by ${overflow}px. Content is likely going off the edge of the screen.`
    );
  }
}

export interface ViewportBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * Asserts that the element identified by selector is within the viewport.
 * By default checks both horizontal and vertical (fully within viewport).
 * Use horizontalOnly: true for scrollable content (e.g. main) where vertical
 * overflow is expected and the intent is "no horizontal overflow".
 */
export async function expectElementInViewport(
  page: Page,
  selector: string,
  options?: { tolerance?: number; horizontalOnly?: boolean }
): Promise<void> {
  const tolerance = options?.tolerance ?? TOLERANCE_PX;
  const horizontalOnly = options?.horizontalOnly ?? false;
  const result = await page.evaluate(
    ({ sel, tol, horizOnly }) => {
      const el = document.querySelector(sel);
      if (!el) return { found: false, message: `Selector "${sel}" matched no element` };
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const leftOk = rect.left >= -tol;
      const rightOk = rect.right <= vw + tol;
      const topOk = rect.top >= -tol;
      const bottomOk = rect.bottom <= vh + tol;
      const inViewport = horizOnly
        ? leftOk && rightOk
        : leftOk && rightOk && topOk && bottomOk;
      return {
        found: true,
        inViewport,
        rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
        viewport: { width: vw, height: vh },
        violations: [
          !leftOk && 'element extends past left edge',
          !rightOk && 'element extends past right edge',
          !horizOnly && !topOk && 'element extends past top edge',
          !horizOnly && !bottomOk && 'element extends past bottom edge',
        ].filter(Boolean) as string[],
      };
    },
    { sel: selector, tol: tolerance, horizOnly: horizontalOnly }
  );
  if (!result.found) {
    throw new Error(result.message);
  }
  if (!result.inViewport) {
    throw new Error(
      `Element "${selector}" is not fully within viewport. ${result.violations?.join('; ') ?? 'Unknown'}. ` +
        `Rect: left=${result.rect!.left.toFixed(0)} right=${result.rect!.right.toFixed(0)} top=${result.rect!.top.toFixed(0)} bottom=${result.rect!.bottom.toFixed(0)}. ` +
        `Viewport: ${result.viewport!.width}x${result.viewport!.height}.`
    );
  }
}
