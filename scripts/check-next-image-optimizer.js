#!/usr/bin/env node
// Checks that apps/web/next.config.js does NOT have images.unoptimized set to true.
// Exit 0 = pass, exit 1 = fail (prints UNOPTIMIZED=true to stdout so CI can grep for it).
// Usage: node scripts/check-next-image-optimizer.js --path apps/web/next.config.js

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const pathIndex = args.indexOf('--path');
const configPath = pathIndex !== -1 ? args[pathIndex + 1] : 'apps/web/next.config.js';
const absPath = path.resolve(process.cwd(), configPath);

if (!fs.existsSync(absPath)) {
  console.error(`File not found: ${absPath}`);
  process.exit(1);
}

const content = fs.readFileSync(absPath, 'utf8');

// Detect `unoptimized: true` — allow for whitespace variations.
const unoptimizedTrue = /unoptimized\s*:\s*true/.test(content);

if (unoptimizedTrue) {
  console.log('UNOPTIMIZED=true');
  console.error(
    `\n❌ images.unoptimized is set to true in ${configPath}.\n` +
      '   Image optimisation must be enabled for Lighthouse performance targets (≥ 90).\n' +
      '   Fix: set images.unoptimized to false (or remove the key) and configure\n' +
      '   images.remotePatterns for any external image hosts.'
  );
  process.exit(1);
}

console.log(`✅ images.unoptimized is not true in ${configPath}`);
process.exit(0);
