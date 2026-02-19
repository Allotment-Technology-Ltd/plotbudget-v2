/**
 * One-time seed: parse root CHANGELOG.md and insert into changelog_entries.
 * Run from repo root: pnpm exec tsx apps/web/scripts/seed-changelog-from-md.ts
 * Requires apps/web/.env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { createAdminClient } from '@repo/supabase';

const REPO_ROOT = process.cwd();
const CHANGELOG_PATH = path.join(REPO_ROOT, 'CHANGELOG.md');
const ENV_PATH = path.join(REPO_ROOT, 'apps', 'web', '.env.local');

/** Match # [1.4.0](url) (2026-02-16) or ## [1.1.1](url) (2026-02-15) */
const VERSION_HEADER = /^#{1,2}\s*\[([^\]]+)\]\([^)]*\)\s*(?:\((\d{4}-\d{2}-\d{2})\))?\s*$/m;

type ParsedEntry = { version: string; released_at: string; content: string };

function parseChangelogMd(raw: string): ParsedEntry[] {
  const re = new RegExp(VERSION_HEADER.source, 'gm');
  const matches: { version: string; date: string | null; contentStart: number; contentEnd: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = re.exec(raw)) !== null) {
    const version = match[1].trim();
    const date = match[2] ?? null;
    const contentStart = match.index + match[0].length;
    matches.push({ version, date, contentStart, contentEnd: raw.length });
    if (matches.length >= 2) {
      matches[matches.length - 2].contentEnd = match.index;
    }
  }

  return matches.map((m) => ({
    version: m.version,
    released_at: m.date ?? new Date().toISOString().slice(0, 10),
    content: raw.slice(m.contentStart, m.contentEnd).trim(),
  }));
}

async function main() {
  config({ path: ENV_PATH });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in', ENV_PATH);
    process.exit(1);
  }

  if (!fs.existsSync(CHANGELOG_PATH)) {
    console.error('CHANGELOG.md not found at', CHANGELOG_PATH);
    process.exit(1);
  }

  const raw = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
  const entries = parseChangelogMd(raw);
  if (entries.length === 0) {
    console.log('No version headers found in CHANGELOG.md');
    process.exit(0);
  }

  const supabase = createAdminClient(url, key);
  const { count, error: countError } = await supabase
    .from('changelog_entries')
    .select('*', { count: 'exact', head: true });
  if (countError) {
    console.error('Failed to check existing entries:', countError);
    process.exit(1);
  }
  if (count != null && count > 0) {
    console.log(`changelog_entries already has ${count} row(s). Skipping seed. Run only once or after clearing the table.`);
    process.exit(0);
  }

  const rows = entries.map((e, i) => ({
    version: e.version,
    released_at: e.released_at + 'T00:00:00Z',
    content: e.content,
    display_order: i,
  }));

  const { error } = await supabase.from('changelog_entries').insert(rows);
  if (error) {
    console.error('Insert failed:', error);
    process.exit(1);
  }
  console.log(`Seeded ${rows.length} changelog entries.`);
}

main();
