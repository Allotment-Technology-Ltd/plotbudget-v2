#!/usr/bin/env node
// Detects any remaining plain <img> tags in apps/web source files.
// Exits non-zero and prints offending files + lines when plain <img> is found.
// Usage: node scripts/find-plain-img.js --path apps/web [--fail]

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const pathIndex = args.indexOf('--path');
const searchPath = pathIndex !== -1 ? args[pathIndex + 1] : 'apps/web';
const absRoot = path.resolve(process.cwd(), searchPath);

// Directories / files to skip entirely (approved exceptions, generated files, tests).
const SKIP_DIRS = new Set(['.next', 'node_modules', '.turbo', 'playwright-report', 'test-results']);
// Files with approved <img> usage (next/og ImageResponse context or email renderers).
const APPROVED_FILE_PATTERNS = [
  /\/app\/apple-icon\.tsx?$/,   // next/og ImageResponse — not HTML DOM
  /\/app\/icon\.tsx?$/,         // next/og ImageResponse — not HTML DOM
  /\/emails\//,                 // react-email templates use their own <Img> component
];
const EXTENSIONS = new Set(['.tsx', '.jsx', '.ts', '.js']);

// Case-sensitive match for <img (lowercase only) — <Img from react-email is NOT a violation.
// Also catches <img at end of line (multi-line tags).
const IMG_PATTERN = /<img(?:[\s>]|$)/g;

let violations = [];

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

function checkFile(filePath) {
  if (APPROVED_FILE_PATTERNS.some((p) => p.test(filePath))) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (IMG_PATTERN.test(line)) {
      violations.push({ file: filePath, line: idx + 1, text: line.trim() });
    }
    IMG_PATTERN.lastIndex = 0; // reset stateful regex
  });
}

walk(absRoot);

if (violations.length === 0) {
  console.log(`✅ No plain <img> tags found in ${searchPath}`);
  process.exit(0);
} else {
  console.error(`\n❌ Found ${violations.length} plain <img> tag(s) in ${searchPath}:`);
  violations.forEach(({ file, line, text }) => {
    const rel = path.relative(process.cwd(), file);
    console.error(`  ${rel}:${line}  ${text.substring(0, 100)}`);
  });
  console.error(
    '\n   Fix: replace <img> with <Image> from "next/image" (or an approved wrapper).\n' +
      '   next/image provides automatic optimisation, lazy loading, and prevents CLS.'
  );
  process.exit(1);
}
