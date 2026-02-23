#!/usr/bin/env node
// Warns about files that declare 'use client' but contain no client-only APIs
// (useState, useEffect, useRef, event handlers, browser globals, etc.).
// These files can likely be converted to React Server Components.
// Exit 0 always (severity: warning); prints candidates to stdout.
// Usage: node scripts/find-unused-use-client.js --path apps/web

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const pathIndex = args.indexOf('--path');
const searchPath = pathIndex !== -1 ? args[pathIndex + 1] : 'apps/web';
const absRoot = path.resolve(process.cwd(), searchPath);

const SKIP_DIRS = new Set(['.next', 'node_modules', '.turbo', 'playwright-report', 'test-results']);
const EXTENSIONS = new Set(['.tsx', '.jsx', '.ts', '.js']);

// Patterns that justify 'use client': React hooks, event handlers, browser APIs, interactivity.
const CLIENT_API_PATTERNS = [
  /\buseState\b/,
  /\buseEffect\b/,
  /\buseReducer\b/,
  /\buseRef\b/,
  /\buseCallback\b/,
  /\buseMemo\b/,
  /\buseContext\b/,
  /\buseLayoutEffect\b/,
  /\buseImperativeHandle\b/,
  /\buseTransition\b/,
  /\buseDeferredValue\b/,
  /\buseId\b/,
  /\buseFormState\b/,
  /\buseFormStatus\b/,
  /\bonClick\b/,
  /\bonChange\b/,
  /\bonSubmit\b/,
  /\bonKeyDown\b/,
  /\bonKeyUp\b/,
  /\bonFocus\b/,
  /\bonBlur\b/,
  /\bonMouseEnter\b/,
  /\bonMouseLeave\b/,
  /\bonTouchStart\b/,
  /\bwindow\b/,
  /\bdocument\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bnavigator\b/,
  /\blocation\b/,
  /\bhistory\b/,
  /\bperformance\b/,
  /\bIntersectionObserver\b/,
  /\bResizeObserver\b/,
  /\bMutationObserver\b/,
  /\bRequestAnimationFrame\b/,
  /\brequestAnimationFrame\b/,
  /\bsetTimeout\b/,
  /\bsetInterval\b/,
  /\bRouter\b/,
  /\buseRouter\b/,
  /\busePathname\b/,
  /\buseSearchParams\b/,
  /\buseParams\b/,
  /\bMotion\b/,
  /\bframer.motion\b/,
  /\banimate\b/,
  /\bposthog\b/,
  /\buseQuery\b/,
  /\buseMutation\b/,
  /\buseStore\b/,
];

let candidates = [];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Only check files that declare 'use client'.
  if (!/'use client'/.test(content) && !/"use client"/.test(content)) return;

  const hasClientApi = CLIENT_API_PATTERNS.some((p) => p.test(content));
  if (!hasClientApi) {
    candidates.push(filePath);
  }
}

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      checkFile(full);
    }
  }
}

walk(absRoot);

if (candidates.length === 0) {
  console.log(`✅ No unnecessary 'use client' directives found in ${searchPath}`);
  process.exit(0);
} else {
  console.warn(`\n⚠️  ${candidates.length} file(s) may have unnecessary 'use client' (no client APIs detected):`);
  candidates.forEach((f) => {
    console.warn(`  ${path.relative(process.cwd(), f)}`);
  });
  console.warn(
    '\n   These files may be convertible to React Server Components.\n' +
      '   Review each file and remove "use client" if no browser/React hooks are used.\n' +
      '   Unnecessary hydration increases bundle size and slows Time-to-Interactive.'
  );
  // Exit 0 — this is advisory only (severity: warning in rules.yaml).
  process.exit(0);
}
