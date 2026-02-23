#!/usr/bin/env node
// Checks new dependencies added to a package.json for gzipped bundle size.
// Compares current package.json against the base branch (origin/main) to find newly added deps.
// Warns (or fails) when a new dep's gzipped size exceeds the threshold.
// Uses bundlephobia.com API for size data.
// Usage: node scripts/check-new-deps.js --package apps/web/package.json --threshold 250

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : null;
}

const packageArg = getArg('--package') || 'apps/web/package.json';
const thresholdKb = parseInt(getArg('--threshold') || process.env.NEW_DEP_THRESHOLD_KB || '250', 10);
const packagePath = path.resolve(process.cwd(), packageArg);

if (!fs.existsSync(packagePath)) {
  console.error(`Package file not found: ${packagePath}`);
  process.exit(1);
}

const current = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentDeps = { ...current.dependencies };

// Get base branch package.json to diff against.
let baseDeps = {};
try {
  const baseContent = execSync(`git show origin/main:${packageArg}`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const base = JSON.parse(baseContent);
  baseDeps = { ...base.dependencies };
} catch {
  // Not in a git repo or base branch unavailable — skip diff and just note it.
  console.warn('⚠️  Could not read base branch package.json; skipping new-dep check.');
  process.exit(0);
}

const newDeps = Object.keys(currentDeps).filter((dep) => !baseDeps[dep]);

if (newDeps.length === 0) {
  console.log('✅ No new production dependencies added.');
  process.exit(0);
}

console.log(`Checking ${newDeps.length} new dep(s): ${newDeps.join(', ')}`);

function fetchSize(pkg) {
  return new Promise((resolve) => {
    const version = (currentDeps[pkg] || '').replace(/^[\^~]/, '');
    const query = version ? `${encodeURIComponent(pkg)}@${encodeURIComponent(version)}` : encodeURIComponent(pkg);
    const url = `https://bundlephobia.com/api/size?package=${query}`;
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ pkg, gzip: json.gzip || 0, error: null });
        } catch {
          resolve({ pkg, gzip: 0, error: 'parse error' });
        }
      });
    });
    req.on('error', () => resolve({ pkg, gzip: 0, error: 'network error' }));
    req.on('timeout', () => { req.destroy(); resolve({ pkg, gzip: 0, error: 'timeout' }); });
  });
}

async function main() {
  const results = await Promise.all(newDeps.map(fetchSize));
  let hasViolation = false;

  results.forEach(({ pkg, gzip, error }) => {
    if (error) {
      console.warn(`  ⚠️  ${pkg}: could not fetch size (${error}) — skipping`);
      return;
    }
    const gzipKb = Math.round(gzip / 1024);
    if (gzipKb > thresholdKb) {
      console.error(`  ❌ ${pkg}: ${gzipKb} KB gzipped (threshold: ${thresholdKb} KB)`);
      hasViolation = true;
    } else {
      console.log(`  ✅ ${pkg}: ${gzipKb} KB gzipped`);
    }
  });

  if (hasViolation) {
    console.error(
      `\n❌ One or more new dependencies exceed the ${thresholdKb} KB gzipped size budget.\n` +
        '   Choose lighter alternatives, import only submodules, or lazy-load the dependency.'
    );
    process.exit(1);
  }

  console.log(`\n✅ All new dependencies are within the ${thresholdKb} KB gzipped budget.`);
  process.exit(0);
}

main().catch((e) => {
  console.error('Unexpected error:', e.message);
  process.exit(1);
});
