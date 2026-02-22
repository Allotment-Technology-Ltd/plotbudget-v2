/**
 * One-off test: PricesAPI.io for UK grocery coverage.
 * Free tier: 1,000 calls/month, 10 requests/minute — this script uses at most 2 calls.
 *
 * Run from repo root: pnpm exec tsx apps/web/scripts/test-prices-api.ts
 * Requires PRICESAPI_API_KEY in apps/web/.env.local
 */
import * as path from 'path';
import { config } from 'dotenv';

const REPO_ROOT = process.cwd();
const ENV_PATH = path.join(REPO_ROOT, 'apps', 'web', '.env.local');
config({ path: ENV_PATH });

const BASE = 'https://api.pricesapi.io/api/v1';
const KEY = process.env.PRICESAPI_API_KEY;

async function main() {
  if (!KEY || !KEY.startsWith('pricesapi_')) {
    console.error('Missing or invalid PRICESAPI_API_KEY in', ENV_PATH);
    process.exit(1);
  }

  console.log('Testing PricesAPI.io (2 requests max to stay within free tier limits)...\n');

  // 1) Search for a grocery term
  const searchQuery = 'semi skimmed milk';
  const searchUrl = `${BASE}/products/search?q=${encodeURIComponent(searchQuery)}&limit=5`;
  const searchRes = await fetch(searchUrl, {
    headers: { 'x-api-key': KEY },
  });
  const searchData = (await searchRes.json()) as {
    success?: boolean;
    data?: { results?: { id: string; title?: string }[]; total?: number };
    error?: { code?: string; message?: string };
  };

  if (!searchRes.ok) {
    console.error('Search failed:', searchRes.status, searchData);
    process.exit(1);
  }
  if (!searchData.success || !searchData.data) {
    console.error('Search response:', searchData);
    process.exit(1);
  }

  const results = searchData.data.results ?? [];
  const total = searchData.data.total ?? 0;
  console.log('1. Search:', searchQuery);
  console.log('   Results:', results.length, 'returned, total:', total);
  results.forEach((r, i) => console.log(`   [${i + 1}] id=${r.id} title=${(r.title ?? '').slice(0, 60)}`));

  if (results.length === 0) {
    console.log('\nNo product IDs to fetch offers. Search may not include UK grocery.');
    return;
  }

  // 2) Get offers for first product with UK country
  const productId = results[0].id;
  const offersUrl = `${BASE}/products/${productId}/offers?country=uk`;
  const offersRes = await fetch(offersUrl, {
    headers: { 'x-api-key': KEY },
  });
  const offersData = (await offersRes.json()) as {
    success?: boolean;
    data?: { offers?: { seller?: string; price?: number; currency?: string }[] };
    error?: { code?: string; message?: string };
  };

  if (!offersRes.ok) {
    console.error('Offers failed:', offersRes.status, offersData.error ?? offersData);
    return;
  }
  if (!offersData.success || !offersData.data?.offers) {
    console.log('\n2. Offers (UK): no offers in response');
    return;
  }

  const offers = offersData.data.offers;
  const sellers = [...new Set(offers.map((o) => o.seller).filter(Boolean))];
  console.log('\n2. Offers (country=uk) for first product:');
  console.log('   Sellers:', sellers.length, '—', sellers.slice(0, 15).join(', '), sellers.length > 15 ? '...' : '');
  const sample = offers.slice(0, 5).map((o) => `${o.seller}: ${o.currency ?? 'GBP'} ${o.price ?? '?'}`);
  console.log('   Sample:', sample.join(' | '));

  const ukGroceryLike = /tesco|sainsbury|asda|morrison|waitrose|aldi|lidl|ocado|co-op|iceland/i;
  const hasGrocerySellers = sellers.some((s) => ukGroceryLike.test(s ?? ''));
  console.log('\n---');
  console.log(hasGrocerySellers ? 'Verdict: UK grocery-style sellers present. API is viable for basket comparison.' : 'Verdict: No obvious UK grocery retailers in offers. May need Apify/multi-source approach.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
