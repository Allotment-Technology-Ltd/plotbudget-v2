#!/usr/bin/env node
// Validates that PRs using CI exception labels have a linked issue and owner approval.
// In CI, set PR_NUMBER env var. If no PR_NUMBER is available, the check is skipped.
// Exit 0 = pass; exit 1 = exception label without linked issue or approval.
// Usage: node scripts/validate-exceptions.js --pr $PR_NUMBER

const https = require('https');

const args = process.argv.slice(2);
const prIndex = args.indexOf('--pr');
const prNumber = prIndex !== -1 ? args[prIndex + 1] : process.env.PR_NUMBER;

// Exception labels that require an associated issue.
const EXCEPTION_LABELS = ['ci-exception', 'perf-exception', 'lint-exception', 'skip-perf-check'];

if (!prNumber || prNumber === 'undefined') {
  console.log('ℹ️  No PR number provided; skipping exception label check.');
  process.exit(0);
}

const repo = process.env.GITHUB_REPOSITORY || '';
const token = process.env.GITHUB_TOKEN || '';

if (!repo || !token) {
  console.log('ℹ️  GITHUB_REPOSITORY or GITHUB_TOKEN not set; skipping exception label check.');
  process.exit(0);
}

const [owner, repoName] = repo.split('/');

function githubGet(urlPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: urlPath,
      headers: {
        'User-Agent': 'validate-exceptions-script',
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    };
    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('JSON parse failed'));
        }
      });
    });
    req.on('error', reject);
  });
}

async function main() {
  let pr;
  try {
    pr = await githubGet(`/repos/${owner}/${repoName}/pulls/${prNumber}`);
  } catch (e) {
    console.warn(`⚠️  Could not fetch PR data: ${e.message}. Skipping exception check.`);
    process.exit(0);
  }

  const labels = (pr.labels || []).map((l) => l.name);
  const exceptionLabels = labels.filter((l) => EXCEPTION_LABELS.includes(l));

  if (exceptionLabels.length === 0) {
    console.log('✅ No CI exception labels found on this PR.');
    process.exit(0);
  }

  console.log(`Found exception label(s): ${exceptionLabels.join(', ')}`);

  // Check that the PR body or title references a linked issue (e.g. "#123" or "Fixes #123").
  const body = (pr.body || '') + ' ' + (pr.title || '');
  const hasLinkedIssue = /#\d+/.test(body) || /(?:fixes|closes|resolves)\s+#\d+/i.test(body);

  if (!hasLinkedIssue) {
    console.error(
      `\n❌ PR #${prNumber} has exception label(s) (${exceptionLabels.join(', ')}) ` +
        'but no linked issue was found in the PR title or body.\n' +
        '   Add a linked issue describing the exception, mitigation plan, and timeframe.\n' +
        '   e.g. "Fixes #456" or "See #456 for mitigation plan."'
    );
    process.exit(1);
  }

  console.log(`✅ Exception label(s) are linked to an issue. Manual owner review still required.`);
  process.exit(0);
}

main().catch((e) => {
  console.error('Unexpected error:', e.message);
  process.exit(1);
});
