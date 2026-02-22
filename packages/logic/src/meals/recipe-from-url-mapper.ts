/**
 * Maps scraper output (e.g. schema.org/Recipe from @rethora/url-recipe-scraper)
 * to our recipe + ingredients shape. Single place to maintain mapping.
 */
import type { CreateRecipeInput, RecipeIngredient } from './schemas';

/** Minimal shape we expect from a recipe scraper (schema.org-style). */
export interface ScrapedRecipe {
  name?: string | null;
  description?: string | null;
  recipeIngredient?: string[] | null;
  recipeYield?: string[] | string | null;
  recipeInstructions?:
    | Array<{ text?: string; itemListElement?: Array<{ text?: string }> }>
    | string
    | null;
  image?: { url?: string } | string | null;
  prepTime?: string | null;
  cookTime?: string | null;
}

/** Result for API: create input plus optional display-only fields. */
export interface ImportedRecipeForApi {
  recipe: CreateRecipeInput & { source_url?: string | null };
  /** Optional; not stored in DB with current schema. */
  image_url?: string | null;
  instructions?: string | null;
  prep_mins?: number | null;
  cook_mins?: number | null;
}

/**
 * Try to split a recipe ingredient line into quantity + name (e.g. "2 tbsp lemon juice" → quantity "2 tbsp", name "lemon juice").
 * Used when importing from URL so the quantity column is pre-filled and useful for scaling/grocery.
 */
function parseIngredientLine(line: string): { name: string; quantity?: string } {
  // Pattern 1: "2 (14-ounce/400g) blocks of tofu" → quantity "2 (14-ounce/400g) blocks", name "tofu"
  const ofMatch = /^(.+?)\s+of\s+(.+)$/.exec(line);
  if (ofMatch) {
    const beforeOf = ofMatch[1].trim();
    const afterOf = ofMatch[2].trim();
    if (/\d/.test(beforeOf) && afterOf.length > 0) {
      return { name: afterOf, quantity: beforeOf };
    }
  }

  // Pattern 2: leading number + optional unit + optional parenthetical, then rest as name
  const quantityFirst =
    /^([\d\s\/½¼¾⅓⅔⅛⅜⅝⅞.]+(?:cup|cups|tbsp|tsp|tablespoon|tablespoons|teaspoon|teaspoons|g|kg|ml|oz|lb|ounce|ounces|pound|pounds|clove|cloves|block|blocks|can|cans|inch|piece|pieces|stalk|stalks|sprig|sprigs)?\s*(?:\([^)]*\))?)\s+(.+)$/i.exec(
      line
    );
  if (quantityFirst) {
    const qty = quantityFirst[1].trim();
    const namePart = quantityFirst[2].trim();
    if (qty.length > 0 && namePart.length > 0 && qty.length < line.length / 2) {
      return { name: namePart, quantity: qty };
    }
  }
  return { name: line, quantity: undefined };
}

/**
 * Decode HTML entities so "It&#039;s" displays as "It's". Handles named and numeric decimal entities.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => {
      const n = parseInt(code, 10);
      return n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const n = parseInt(hex, 16);
      return n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
    });
}

/** Reasonable range for serving count (avoids treating "makes 16 pancakes" as 16 servings when it's 4-6). */
const SERVINGS_MIN = 1;
const SERVINGS_MAX = 24;

/**
 * Parse a recipe yield string to a single serving count.
 * e.g. "Serves 4-6 (makes 16 pancakes)" → 5; "Serves 4" → 4; "8" → 8.
 * Avoids concatenating digits (which would turn "4-6" and "16" into 4616).
 */
function parseServingsFromYield(yieldStr: string): number {
  const s = yieldStr.toLowerCase().trim();
  if (!s) return 0;

  // "serves 4" or "serves 4-6" or "serves 4 to 6"
  const servesMatch = s.match(/serves?\s*(\d+)(?:\s*[-–—to]\s*(\d+))?/i);
  if (servesMatch) {
    const a = parseInt(servesMatch[1], 10);
    const b = servesMatch[2] ? parseInt(servesMatch[2], 10) : a;
    if (!Number.isNaN(a) && a >= SERVINGS_MIN && a <= SERVINGS_MAX) {
      if (!Number.isNaN(b) && b >= a && b <= SERVINGS_MAX) {
        return Math.round((a + b) / 2); // range: use midpoint
      }
      return a;
    }
  }

  // First standalone number or range (e.g. "4-6" or "8")
  const rangeMatch = s.match(/(\d+)\s*[-–—]\s*(\d+)/);
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1], 10);
    const b = parseInt(rangeMatch[2], 10);
    if (!Number.isNaN(a) && a >= SERVINGS_MIN && a <= SERVINGS_MAX && !Number.isNaN(b) && b >= a) {
      return Math.round((a + b) / 2);
    }
  }

  const firstNumMatch = s.match(/\d+/);
  if (firstNumMatch) {
    const num = parseInt(firstNumMatch[0], 10);
    if (!Number.isNaN(num) && num >= SERVINGS_MIN && num <= SERVINGS_MAX) return num;
  }

  return 0;
}

/**
 * Parse ISO 8601 duration (e.g. PT20M, PT1H30M) to minutes.
 */
function parseDurationToMinutes(value: string | undefined | null): number | null {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return null;
  const hours = parseInt(match[1] ?? '0', 10);
  const mins = parseInt(match[2] ?? '0', 10);
  const secs = parseInt(match[3] ?? '0', 10);
  return hours * 60 + mins + Math.round(secs / 60);
}

/**
 * Map scraper output to our CreateRecipeInput + optional API-only fields.
 * Uses source_url for the original URL; strips HTML from description if present.
 *
 * Legal / attribution: Recipes imported from a URL must retain source_url and the app must
 * display a clear link/credit to the original source (e.g. on detail view and list). See
 * recipe detail and list components that show "Recipe from [host]" when source_url is set.
 */
export function mapScrapedRecipeToImported(
  scraped: ScrapedRecipe,
  sourceUrl: string
): ImportedRecipeForApi {
  const name = (scraped.name ?? '').trim() || 'Untitled recipe';
  let description: string | undefined =
    typeof scraped.description === 'string' ? scraped.description.trim() : undefined;
  if (description) description = decodeHtmlEntities(description).trim();

  const rawIngredients = Array.isArray(scraped.recipeIngredient)
    ? scraped.recipeIngredient
    : [];
  const ingredients: RecipeIngredient[] = rawIngredients.map((line) => {
    const trimmed = typeof line === 'string' ? line.trim() : '';
    if (!trimmed) return { name: '—', quantity: undefined };
    const parsed = parseIngredientLine(trimmed);
    return { name: parsed.name, quantity: parsed.quantity };
  });

  let servings = 1;
  const yieldVal = scraped.recipeYield;
  const yieldStr =
    Array.isArray(yieldVal) && yieldVal.length > 0
      ? String(yieldVal[0] ?? '').trim()
      : typeof yieldVal === 'string'
        ? yieldVal.trim()
        : '';
  if (yieldStr) {
    const parsed = parseServingsFromYield(yieldStr);
    if (parsed > 0) servings = parsed;
  }

  let image_url: string | null = null;
  const img = scraped.image;
  if (img && typeof img === 'object' && typeof img.url === 'string') image_url = img.url;
  else if (typeof img === 'string') image_url = img;

  let instructions: string | null = null;
  const instr = scraped.recipeInstructions;
  if (Array.isArray(instr) && instr.length > 0) {
    const texts: string[] = [];
    for (const step of instr) {
      if (typeof step !== 'object' || !step) continue;
      if ('text' in step && step.text) texts.push(String(step.text).trim());
      if ('itemListElement' in step && Array.isArray(step.itemListElement)) {
        for (const el of step.itemListElement) {
          if (el?.text) texts.push(String(el.text).trim());
        }
      }
    }
    if (texts.length > 0) instructions = decodeHtmlEntities(texts.join('\n\n'));
  } else if (typeof instr === 'string') instructions = decodeHtmlEntities(instr);

  return {
    recipe: {
      name: name.slice(0, 200),
      description: description?.slice(0, 5000) ?? undefined,
      ingredients,
      servings,
      source_url: sourceUrl,
      instructions: instructions ?? undefined,
    },
    image_url,
    instructions,
    prep_mins: parseDurationToMinutes(scraped.prepTime ?? undefined),
    cook_mins: parseDurationToMinutes(scraped.cookTime ?? undefined),
  };
}
