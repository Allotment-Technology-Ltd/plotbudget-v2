#!/usr/bin/env node

const { execFileSync } = require('node:child_process');

const dbUrl = process.env.SUPABASE_DEV_DB_URL;
if (!dbUrl) {
  console.error('Missing SUPABASE_DEV_DB_URL. Add it as a CI secret.');
  process.exit(1);
}

let output = '';
try {
  output = execFileSync(
    'npx',
    ['supabase', 'migration', 'list', '--db-url', dbUrl],
    { encoding: 'utf8' }
  );
} catch (error) {
  const stdout = error.stdout ? String(error.stdout) : '';
  const stderr = error.stderr ? String(error.stderr) : '';
  console.error('Failed to run supabase migration list.');
  if (stdout) {
    console.error(stdout.trim());
  }
  if (stderr) {
    console.error(stderr.trim());
  }
  process.exit(1);
}

const rows = output
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && line.includes('|'))
  .filter((line) => !line.startsWith('Local') && !line.startsWith('-'));

const mismatches = [];
for (const row of rows) {
  const parts = row.split('|').map((part) => part.trim());
  if (parts.length < 2) {
    continue;
  }
  const local = parts[0];
  const remote = parts[1];
  if (!local || !remote) {
    mismatches.push(row);
  }
}

if (mismatches.length > 0) {
  console.error('Migration history mismatch between repo and dev DB:');
  mismatches.forEach((row) => console.error(`- ${row}`));
  process.exit(1);
}

console.log('Migration history is in sync with dev DB.');
