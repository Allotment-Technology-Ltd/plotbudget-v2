#!/usr/bin/env node
// Checks production dependencies in a package.json for wildcard or loose version ranges.
// Warns when a dep uses `*`, `latest`, or a leading `^` (caret) range.
// Pinned (`1.2.3`) and tilde (`~1.2.3`) ranges are accepted.
// Exit 0 always (severity: warning); prints offenders to stdout.
// Usage: node scripts/check-dep-versions.js --path apps/web/package.json

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const pathIndex = args.indexOf('--path');
const pkgPath = pathIndex !== -1 ? args[pathIndex + 1] : 'apps/web/package.json';
const absPath = path.resolve(process.cwd(), pkgPath);

if (!fs.existsSync(absPath)) {
  console.error(`File not found: ${absPath}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(absPath, 'utf8'));
const deps = pkg.dependencies || {};

const loose = [];

for (const [name, version] of Object.entries(deps)) {
  if (
    version === '*' ||
    version === 'latest' ||
    version.startsWith('^') ||
    version.startsWith('>=') ||
    version.startsWith('>')
  ) {
    loose.push({ name, version });
  }
}

if (loose.length === 0) {
  console.log(`✅ All production dependencies in ${pkgPath} use pinned or tilde ranges.`);
  process.exit(0);
}

console.warn(`\n⚠️  ${loose.length} production dep(s) in ${pkgPath} use loose version ranges:`);
loose.forEach(({ name, version }) => {
  console.warn(`  ${name}: "${version}"`);
});
console.warn(
  '\n   Recommendation: pin or use tilde (~) ranges for production dependencies\n' +
    '   to avoid unexpected size increases from automatic upgrades.\n' +
    '   e.g. change "^1.2.3" → "~1.2.3" or "1.2.3" for critical deps.'
);

// Exit 0 — this is advisory only (severity: warning in rules.yaml).
process.exit(0);
