/**
 * Run the trial test users seed script via psql.
 * Loads DEV_DATABASE_URL from .env.local.
 *
 * Run: pnpm --filter @repo/web run-seed-trial-users
 * Or: cd apps/web && pnpm exec tsx scripts/run-seed-trial-test-users.ts
 */
import path from 'path';
import { config } from 'dotenv';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

config({ path: path.resolve(__dirname, '..', '.env.local') });

const dbUrl = process.env.DEV_DATABASE_URL;
if (!dbUrl) {
  console.error(
    'DEV_DATABASE_URL is not set in apps/web/.env.local.\n' +
      'Add your Supabase Postgres connection string:\n' +
      '  DEV_DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres\n' +
      'Get it from Supabase Dashboard → Settings → Database → Connection string → URI (use Session pooler).'
  );
  process.exit(1);
}

const sqlPath = path.join(__dirname, 'seed-trial-test-users.sql');
if (!existsSync(sqlPath)) {
  console.error(`Seed file not found: ${sqlPath}`);
  process.exit(1);
}

const pathEnv = process.env.PATH || '';
const brewPath = '/opt/homebrew/opt/libpq/bin';
const envWithPsql = { ...process.env, PATH: `${brewPath}:${pathEnv}` };

try {
  execSync(`psql "${dbUrl}" -f "${sqlPath}"`, {
    stdio: 'inherit',
    env: envWithPsql,
  });
  console.log('\nDone.');
} catch (err) {
  process.exit(1);
}
