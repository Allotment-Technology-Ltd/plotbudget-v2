#!/usr/bin/env node
// Checks that <Image> (next/image) components and any remaining plain <img> elements
// include explicit width/height attributes (or use fill/sizes) to prevent CLS.
// Exit 0 = pass, exit 1 = violations found.
// Usage: node scripts/enforce-image-attrs.js --path apps/web [--fail]

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const pathIndex = args.indexOf('--path');
const searchPath = pathIndex !== -1 ? args[pathIndex + 1] : 'apps/web';
const shouldFail = args.includes('--fail');
const absRoot = path.resolve(process.cwd(), searchPath);

const SKIP_DIRS = new Set(['.next', 'node_modules', '.turbo', 'playwright-report', 'test-results']);
// Files with approved image usage outside standard HTML DOM context.
const APPROVED_FILE_PATTERNS = [
  /\/app\/apple-icon\.tsx?$/,
  /\/app\/icon\.tsx?$/,
  /\/emails\//,
];
const EXTENSIONS = new Set(['.tsx', '.jsx', '.ts', '.js']);

let violations = [];

// Matches a self-closing or open <Image or <img tag and captures its attributes.
// We look for <Image or <img that lack width/height AND lack fill/sizes props.
const IMAGE_OPEN_TAG = /<(?:Image|img)\s([^>]*?)(?:\/>|>)/gs;

function isExempt(attrs) {
  // Exempt if the image uses next/image fill mode or has explicit size attributes.
  return (
    /\bfill\b/.test(attrs) ||
    /\bwidth\s*[={]/.test(attrs) ||
    /\bheight\s*[={]/.test(attrs) ||
    /\bsizes\s*[={]/.test(attrs)
  );
}

function checkFile(filePath) {
  if (APPROVED_FILE_PATTERNS.some((p) => p.test(filePath))) return;
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  IMAGE_OPEN_TAG.lastIndex = 0;
  while ((match = IMAGE_OPEN_TAG.exec(content)) !== null) {
    const attrs = match[1] || '';
    if (!isExempt(attrs)) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      violations.push({
        file: filePath,
        line: lineNum,
        tag: match[0].substring(0, 80),
      });
    }
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

if (violations.length === 0) {
  console.log(`✅ All images in ${searchPath} have explicit sizing or use fill mode`);
  process.exit(0);
} else {
  const level = shouldFail ? 'error' : 'warning';
  console.warn(`\n⚠️  [${level}] ${violations.length} image(s) missing width/height/fill in ${searchPath}:`);
  violations.forEach(({ file, line, tag }) => {
    const rel = path.relative(process.cwd(), file);
    console.warn(`  ${rel}:${line}  ${tag}`);
  });
  console.warn(
    '\n   Fix: add explicit width and height props, or use fill + a sized container,\n' +
      '   or add sizes prop when using responsive images with next/image.'
  );
  if (shouldFail) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}
