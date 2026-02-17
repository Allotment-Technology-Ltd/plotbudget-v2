/**
 * Sanitize and present changelog content for public display.
 * - Removes sensitive data: tokens, env vars, file paths (.env, .gitignore), secrets.
 * - Removes internal noise: Co-authored-by, commit hashes, CI/tooling-only lines.
 * - User-friendly section names and high-level, marketing-safe descriptions.
 */

const COAUTHORED_BY = /^Co-authored-by:.+$/gm;
const COMMIT_HASH_LINK = /\[([a-f0-9]{7})\]\([^)]+\)/g;
const STANDALONE_COMMIT = /\([a-f0-9]{7,40}\)(?!\s*\))/g;

/** Lines or bullets we skip (sensitive or internal-only). */
const SENSITIVE_PATTERNS = [
  /\.env\b/i,
  /\.gitignore\b/i,
  /\btoken\b/i,
  /\bapi[_-]?key\b/i,
  /\bsecret\b/i,
  /\bpassword\b/i,
  /\bVERCEL_/i,
  /\bSUPABASE_/i,
  /\bPOLAR_/i,
  /\bRESEND_/i,
  /\bNEXT_PUBLIC_[A-Z_]+/i,
  /_KEY\b/i,
  /_SECRET\b/i,
  /\bmiddleware\.(ts|js)\b/i,
  /\bdb-cleanup\b/i,
  /\bplaywright\b/i,
  /\bvitest\b/i,
  /\bhusky\b/i,
  /\[skip ci\]/i,
  /Co-authored-by/i,
];

/** Section renames for marketing-friendly copy. */
const SECTION_RENAMES = {
  '### Features': '### What\'s new',
  '### Bug Fixes': '### Improvements',
  '### BREAKING CHANGES': '### Important changes',
};

/**
 * Returns true if the line looks safe to show (no sensitive or internal-only content).
 */
function isLineSafe(line) {
  const trimmed = line.trim();
  if (!trimmed) return true;
  for (const p of SENSITIVE_PATTERNS) {
    if (p.test(trimmed)) return false;
  }
  return true;
}

/**
 * Sanitize a single line: remove commit hash links, redact any remaining hash-like text.
 */
function sanitizeLine(line) {
  let out = line
    .replace(COMMIT_HASH_LINK, '')
    .replace(STANDALONE_COMMIT, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return out;
}

/**
 * Apply user-friendly section renames to a line.
 */
function renameSection(line) {
  let out = line;
  for (const [from, to] of Object.entries(SECTION_RENAMES)) {
    if (out.startsWith(from)) return to;
  }
  return out;
}

/**
 * Sanitize raw CHANGELOG.md content for public, marketing-safe display.
 * Removes sensitive and internal-only lines; renames sections; strips commit refs.
 */
export function sanitizeChangelogContent(raw) {
  if (!raw || typeof raw !== 'string') return '';

  let text = raw
    .replace(COAUTHORED_BY, '')
    .replace(/\r\n/g, '\n');

  const lines = text.split('\n');
  const out = [];
  let inSensitiveBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!isLineSafe(line)) {
      inSensitiveBlock = true;
      continue;
    }

    const renamed = renameSection(line);
    const sanitized = sanitizeLine(renamed);
    if (sanitized) out.push(sanitized);
    else if (line.startsWith('#')) out.push(line);
    inSensitiveBlock = false;
  }

  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
