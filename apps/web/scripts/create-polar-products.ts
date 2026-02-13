/**
 * Create Polar products via API.
 *
 * Note: Polar's API currently restricts price_currency to USD when creating
 * products. Multi-currency (GBP/EUR) is not yet supported at product creation.
 * Uses minimum $4 for PWYL (approx £3 equivalent).
 *
 * Creates:
 * - 1 PWYL product (USD, min $4)
 * - 2 Fixed products (Monthly $4.99, Annual $49.99)
 *
 * Usage:
 *   pnpm run create-polar-products -- --sandbox  # for sandbox
 *   pnpm run create-polar-products               # for production
 *
 * Requires POLAR_ACCESS_TOKEN in .env.local
 * Set POLAR_SANDBOX=true in .env.local or pass --sandbox flag
 */

import path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(process.cwd(), '.env.local') });

// Parse CLI args
const args = process.argv.slice(2);
const useSandbox = args.includes('--sandbox') || process.env.POLAR_SANDBOX === 'true';

const API_BASE = useSandbox ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';

interface ProductSpec {
  name: string;
  type: 'pwyl' | 'fixed';
  interval: 'month' | 'year';
  amount: number; // cents
}

const PRODUCTS: ProductSpec[] = [
  // PWYL: min $4 (Polar API only accepts USD)
  { name: 'PLOT Premium (Pay What You Like)', type: 'pwyl', interval: 'month', amount: 400 },
  // Fixed: $4.99/month, $49.99/year
  { name: 'PLOT Premium Monthly', type: 'fixed', interval: 'month', amount: 499 },
  { name: 'PLOT Premium Annual', type: 'fixed', interval: 'year', amount: 4999 },
];

async function createProduct(
  token: string,
  spec: ProductSpec
): Promise<{ id: string }> {
  const body = {
    name: spec.name,
    description:
      spec.type === 'pwyl'
        ? 'Support PLOT with your chosen monthly contribution. Minimum $4.'
        : 'Access all premium features of PLOT.',
    recurring_interval: spec.interval,
    recurring_interval_count: 1,
    prices: [
      spec.type === 'pwyl'
        ? {
            amount_type: 'custom',
            price_currency: 'usd',
            minimum_amount: spec.amount,
          }
        : {
            amount_type: 'fixed',
            price_currency: 'usd',
            price_amount: spec.amount,
          },
    ],
  };

  const res = await fetch(`${API_BASE}/v1/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }

  const product = (await res.json()) as { id: string };
  return product;
}

async function main() {
  if (!process.env.POLAR_ACCESS_TOKEN) {
    console.error('❌ POLAR_ACCESS_TOKEN is not set. Add it to .env.local and try again.');
    process.exit(1);
  }

  const token = process.env.POLAR_ACCESS_TOKEN;

  console.log(`🚀 Creating products in Polar ${useSandbox ? 'SANDBOX' : 'PRODUCTION'}...`);
  console.log(`   Using ${API_BASE}\n`);

  const createdProducts: Array<{ name: string; id: string; type: string }> = [];

  for (const spec of PRODUCTS) {
    try {
      console.log(`Creating: ${spec.name}...`);

      const product = await createProduct(token, spec);

      const productId = product.id;
      createdProducts.push({
        name: spec.name,
        id: productId,
        type: spec.type,
      });

      console.log(`✅ Created: ${productId}\n`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to create ${spec.name}:`, msg);
      process.exit(1);
    }
  }

  // Output summary (Polar API is USD-only; use same PWYL ID for all currency env vars)
  console.log('\n' + '='.repeat(80));
  console.log('✅ All products created successfully!\n');
  console.log('Add these to your .env.local or Vercel environment variables:\n');

  const pwyl = createdProducts.find((p) => p.type === 'pwyl');
  const monthly = createdProducts.find((p) => p.type === 'fixed' && p.name.includes('Monthly'));
  const annual = createdProducts.find((p) => p.type === 'fixed' && p.name.includes('Annual'));

  console.log('# PWYL (USD only - Polar API restriction; use same ID for all currencies)');
  if (pwyl) {
    console.log(`POLAR_PWYL_GBP_PRODUCT_ID=${pwyl.id}`);
    console.log(`POLAR_PWYL_USD_PRODUCT_ID=${pwyl.id}`);
    console.log(`POLAR_PWYL_EUR_PRODUCT_ID=${pwyl.id}`);
    console.log(`# Or legacy: POLAR_PWYL_BASE_PRODUCT_ID=${pwyl.id}`);
  }

  console.log('\n# Fixed (USD)');
  if (monthly) console.log(`POLAR_PREMIUM_PRODUCT_ID=${monthly.id}`);
  if (annual) console.log(`POLAR_PREMIUM_ANNUAL_PRODUCT_ID=${annual.id}`);

  console.log('\n' + '='.repeat(80));
  console.log(`\nNext steps:`);
  console.log(`1. Copy the env vars above to .env.local (for local dev)`);
  console.log(`2. Add them to Vercel ${useSandbox ? '(NOT YET - this is sandbox!)' : 'Production environment variables'}`);
  console.log(`3. ${useSandbox ? 'Test checkout flow locally with sandbox' : 'Deploy and verify production checkout'}`);
  console.log(`4. Verify in Polar dashboard: ${useSandbox ? 'https://sandbox.polar.sh' : 'https://polar.sh'}`);
}

main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
