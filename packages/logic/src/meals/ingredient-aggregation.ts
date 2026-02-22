/**
 * Parse and aggregate ingredient lines (e.g. "200g chicken" + "150g chicken" → "350g chicken").
 * Used when generating a grocery list from multiple recipes/meal plan entries.
 */

export interface ParsedIngredient {
  /** Normalized name (lowercase, trimmed) for grouping */
  nameKey: string;
  /** Display name (original casing from first occurrence) */
  name: string;
  /** Parsed numeric value if detectable, else null */
  value: number | null;
  /** Unit string e.g. "g", "ml", "tbsp" */
  unit: string | null;
  /** Original quantity string e.g. "200g" */
  quantityText: string;
}

const NUMERIC = /^[\d.,]+/;

/**
 * Parse a quantity string like "200g", "1 tbsp", "2" into value + unit.
 */
export function parseQuantity(quantity: string): { value: number | null; unit: string | null } {
  const trimmed = quantity.trim();
  if (!trimmed) return { value: null, unit: null };
  const numMatch = trimmed.match(NUMERIC);
  if (!numMatch) return { value: null, unit: trimmed || null };
  const numStr = numMatch[0].replace(/,/g, '.');
  const value = parseFloat(numStr);
  if (Number.isNaN(value)) return { value: null, unit: trimmed.replace(NUMERIC, '').trim() || null };
  const rest = trimmed.slice(numMatch[0].length).trim();
  const unitMatch = rest.match(/^(g|kg|ml|l|oz|lb|tbsp|tsp|clove|cloves|pinch|cup|cups|can|cans|pack|packs|slice|slices|large|small|medium)/i);
  const unit = unitMatch ? unitMatch[1] : (rest || null);
  return { value, unit };
}

/**
 * Normalize ingredient name for grouping (lowercase, collapse spaces).
 */
export function normalizeIngredientName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Parse one ingredient line into name + quantity.
 */
export function parseIngredientLine(
  name: string,
  quantity?: string | null
): ParsedIngredient {
  const displayName = name.trim() || 'Unknown';
  const nameKey = normalizeIngredientName(displayName);
  const qText = (quantity ?? '').trim();
  const { value, unit } = parseQuantity(qText);
  return {
    nameKey,
    name: displayName,
    value,
    unit,
    quantityText: qText || displayName,
  };
}

export interface AggregatedIngredient {
  name: string;
  quantityText: string;
  quantityValue: number | null;
  quantityUnit: string | null;
}

/**
 * Composite key for grouping: same ingredient name + same unit are merged.
 * Different units (e.g. "2 tbsp butter" vs "50g butter") stay as separate lines.
 */
function groupKey(nameKey: string, unit: string | null): string {
  const u = (unit ?? '').trim().toLowerCase();
  return `${nameKey}\n${u}`;
}

/** Compact units that are typically written without a space (e.g. 200g, 100ml). */
const COMPACT_UNITS = new Set(['g', 'kg', 'ml', 'l', 'oz', 'lb']);
function formatQuantityText(total: number, unit: string | null): string {
  const u = (unit ?? '').trim();
  if (!u) return String(total);
  const uLower = u.toLowerCase();
  if (COMPACT_UNITS.has(uLower) && u.length <= 3) return `${total}${u}`;
  return `${total} ${u}`;
}

/**
 * Combine multiple parsed ingredients with the same name and unit.
 * e.g. 200g chicken + 150g chicken → 350g chicken; 2 tbsp butter + 1 tbsp butter → 3 tbsp butter.
 * Same ingredient with different units (e.g. 2 tbsp + 50g butter) produce separate lines.
 */
export function aggregateIngredients(parsed: ParsedIngredient[]): AggregatedIngredient[] {
  const byKey = new Map<string, { name: string; values: number[]; unit: string | null }>();
  for (const p of parsed) {
    const key = groupKey(p.nameKey, p.unit);
    const existing = byKey.get(key);
    if (existing) {
      if (p.value != null) existing.values.push(p.value);
      else existing.values.push(1); // treat "some" / unparseable as 1 for display
    } else {
      byKey.set(key, {
        name: p.name,
        values: p.value != null ? [p.value] : [1],
        unit: p.unit,
      });
    }
  }
  const result: AggregatedIngredient[] = [];
  for (const [, v] of byKey) {
    const total = v.values.reduce((a, b) => a + b, 0);
    result.push({
      name: v.name,
      quantityText: formatQuantityText(total, v.unit),
      quantityValue: total,
      quantityUnit: v.unit,
    });
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Take raw ingredient list (name + quantity per line) and return aggregated list.
 */
export function aggregateIngredientLines(
  lines: Array<{ name: string; quantity?: string | null }>
): AggregatedIngredient[] {
  const parsed = lines.map((l) => parseIngredientLine(l.name, l.quantity));
  return aggregateIngredients(parsed);
}
