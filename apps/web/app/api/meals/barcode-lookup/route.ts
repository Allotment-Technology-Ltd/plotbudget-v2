import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getHouseholdIdForUser } from '@/lib/household-for-user';

/**
 * Proxy to Open Food Facts API (no CORS from client).
 * GET /api/meals/barcode-lookup?barcode=3017620422003
 * Returns { found, name?, quantity_value?, quantity_unit? } for pantry pre-fill.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await getHouseholdIdForUser(supabase, user.id);
  // No household check needed for read-only external lookup; we already required auth.

  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get('barcode')?.trim();
  if (!barcode || !/^\d+$/.test(barcode)) {
    return NextResponse.json({ error: 'Valid barcode (digits only) required' }, { status: 400 });
  }

  const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'PlotBudget-Pantry/1.0 (https://github.com/plotbudget)' },
      next: { revalidate: 3600 },
    });
  } catch (e) {
    console.error('Barcode lookup fetch failed:', e);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: 'Lookup service error' }, { status: 502 });
  }

  type OFFProduct = {
    status?: number;
    product?: {
      product_name?: string;
      product_name_en?: string;
      quantity?: string;
      quantity_value?: number;
      quantity_unit?: string;
    };
  };
  const data = (await res.json()) as OFFProduct;
  const product = data?.product;
  const status = data?.status;

  if (status !== 1 || !product) {
    return NextResponse.json({
      found: false,
      name: null,
      quantity_value: null,
      quantity_unit: null,
    });
  }

  const name =
    (product.product_name_en || product.product_name || '').trim() ||
    null;
  let quantity_value: number | null = product.quantity_value ?? null;
  let quantity_unit: string | null = (product.quantity_unit || product.quantity || '').trim() || null;

  if (quantity_value == null && product.quantity) {
    const match = product.quantity.match(/^([\d.,]+)\s*(\w*)/);
    if (match) {
      quantity_value = parseFloat(match[1].replace(/,/g, '.')) || null;
      if (match[2]) quantity_unit = match[2].trim() || null;
    }
  }

  return NextResponse.json({
    found: true,
    name,
    quantity_value,
    quantity_unit,
  });
}
