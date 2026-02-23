#!/usr/bin/env node
// Validates that all required CI helper scripts and workflow files exist.
// Fails early with an actionable message if any are missing.
// Usage: node scripts/validate-ci-prereqs.js --expect scripts/foo.js,scripts/bar.js,.github/workflows/ci.yml

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const expectIndex = args.indexOf('--expect');
const defaultExpected = [
  'scripts/check-next-image-optimizer.js',
  'scripts/find-plain-img.js',
  'scripts/parse-webpack-stats.js',
  'scripts/enforce-image-attrs.js',
  'scripts/find-unused-use-client.js',
  'scripts/check-new-deps.js',
  'scripts/check-dep-versions.js',
  'scripts/validate-exceptions.js',
  '.github/workflows/perf-guard.yml',
  'lhci-apps-web.config.js',
];

const expectedFiles =
  expectIndex !== -1
    ? args[expectIndex + 1].split(',').map((f) => f.trim())
    : defaultExpected;

const missing = [];
for (const file of expectedFiles) {
  const absPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(absPath)) {
    missing.push(file);
  }
}

if (missing.length === 0) {
  console.log(`✅ All ${expectedFiles.length} required CI files are present.`);
  process.exit(0);
} else {
  console.error(`\n❌ Missing ${missing.length} required CI file(s):`);
  missing.forEach((f) => console.error(`  ${f}`));
  console.error(
    '\n   Add the missing scripts/workflows to the repository root.\n' +
      '   See rules.yaml for each file\'s purpose and the required implementation.'
  );
  process.exit(1);
}
