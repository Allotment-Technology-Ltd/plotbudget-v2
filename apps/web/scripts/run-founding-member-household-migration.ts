/**
 * Apply the founding_member_until migration to the dev database.
 * Uses DEV_DATABASE_URL from .env.local.
 *
 * Run: pnpm run db:apply-founding-member-household
 * (from repo root or apps/web)
 */
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local from apps/web
const envPath = path.resolve(process.cwd(), '.env.local');
config({ path: envPath });

const dbUrl = process.env.DEV_DATABASE_URL;
if (!dbUrl) {
  console.error('DEV_DATABASE_URL is not set. Add it to apps/web/.env.local');
  process.exit(1);
}

const sqlPath = path.resolve(process.cwd(), 'scripts/dev-db-add-founding_member_until_to_households.sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');

async function run() {
  const { Client } = await import('pg');
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    await client.query(sql);
    console.log('✅ Migration applied: founding_member_until on households');
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
