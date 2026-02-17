/**
 * Sanitize and present changelog content for public display.
 *
 * Primary source: apps/marketing/content/changelog.md — written per docs/CHANGELOG-UX-GUIDE.md
 * so it is user-friendly by default and needs minimal sanitization. This module is used when
 * that file is missing (fallback: root CHANGELOG.md) and strips sensitive data, refs, and
 * internal-only lines.
 */

const COAUTHORED_BY = /^Co-authored-by:.+$/gm;
const COMMIT_HASH_LINK = /\[([a-f0-9]{7})\][^(]*\([^)]+\)/g;
const STANDALONE_COMMIT = /\([a-f0-9]{7,40}\)(?!\s*\))/g;
/** Issue/PR links like [#58](url) or (#65) */
const ISSUE_PR_REF = /\[?#\d+\]?(?:\([^)]+\))?/g;
/** Version header: # [1.4.0](url) (2026-02-16) or ## [1.1.1](url) ... -> keep version and optional date */
const VERSION_HEADER = /^#{1,2}\s*\[([^\]]+)\]\([^)]+\)\s*(?:\(([^)]+)\))?\s*$/;
/** Parenthesised date or ref at end of line or standalone */
const TRAILING_PAREN_DATE_OR_REF = /\s*\(\d{4}-\d{2}-\d{2}\)\s*$|\s*\(#[^)]*\)\s*$/g;
/** Bold scope prefix: **native:** or **web:** etc. */
const BOLD_SCOPE_PREFIX = /^\s*\*\*[a-z-]+:\*\*\s*/i;
/** feat!, fix(scope): etc. */
const CONVENTIONAL_PREFIX = /^\s*(?:feat|fix|chore|docs)(?:!|\([^)]+\))?:\s*/i;

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
];

/** Bullets we skip when they're purely developer/CI (only run when line is a bullet). */
const INTERNAL_BULLET_PATTERNS = [
  /^\s*-\s+.*\b(?:CI|E2E|e2e|Vercel|deploy|build|migration|TypeScript|Suspense|middleware)\b.*$/i,
  /^\s*\*\s+.*\b(?:CI|E2E|e2e|Vercel|deploy|build|migration|TypeScript|Suspense|middleware)\b.*$/i,
  /^\s*-\s+.*\b(?:timeout|snapshot|tolerance|flaky|assertion)\b.*$/i,
  /^\s*\*\s+.*\b(?:timeout|snapshot|tolerance|flaky|assertion)\b.*$/i,
  /^\s*feat!?:/i,
  /^\s*fix\(/i,
  /^\s*PLOT-\d+/i,
];

/** Section renames for marketing-friendly copy. */
const SECTION_RENAMES = {
  '### Features': "### What's new",
  '### Bug Fixes': '### Improvements',
  '### BREAKING CHANGES': '### Important changes',
};

function isLineSafe(line) {
  const trimmed = line.trim();
  if (!trimmed) return true;
  for (const p of SENSITIVE_PATTERNS) {
    if (p.test(trimmed)) return false;
  }
  return true;
}

/** True if the line looks like an internal-only bullet we should hide from users. */
function isInternalBullet(line) {
  const trimmed = line.trim();
  if (!trimmed || !/^[-*]/.test(trimmed)) return false;
  for (const p of INTERNAL_BULLET_PATTERNS) {
    if (p.test(trimmed)) return true;
  }
  return false;
}

/**
 * Format a version header line: "# [1.4.0](url) (2026-02-16)" -> "## 1.4.0"
 * Optional: append " — February 2026" if date is present.
 */
function formatVersionHeader(line) {
  const match = line.match(VERSION_HEADER);
  if (!match) return null;
  const version = match[1].trim();
  const dateRaw = match[2];
  if (!dateRaw) return `## ${version}`;
  const date = formatFriendlyDate(dateRaw);
  return date ? `## ${version} — ${date}` : `## ${version}`;
}

function formatFriendlyDate(iso) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[parseInt(m[2], 10) - 1];
  return month ? `${month} ${m[1]}` : '';
}

/**
 * Sanitize a single line for display: remove refs, hashes, scope prefixes, extra spaces.
 */
function sanitizeLine(line) {
  let out = line
    .replace(COMMIT_HASH_LINK, '')
    .replace(STANDALONE_COMMIT, '')
    .replace(ISSUE_PR_REF, '')
    .replace(TRAILING_PAREN_DATE_OR_REF, '')
    .replace(BOLD_SCOPE_PREFIX, '')
    .replace(CONVENTIONAL_PREFIX, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return out;
}

function renameSection(line) {
  let out = line;
  for (const [from, to] of Object.entries(SECTION_RENAMES)) {
    if (out.startsWith(from)) return to;
  }
  return out;
}

/**
 * Sanitize raw CHANGELOG content for public, marketing-safe display.
 * Strips links, refs, and internal-only lines; renames sections; formats version headers.
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

    if (inSensitiveBlock && trimmed && !line.startsWith('#')) continue;

    const versionHeader = formatVersionHeader(line);
    if (versionHeader) {
      out.push(versionHeader);
      inSensitiveBlock = false;
      continue;
    }

    if (isInternalBullet(line)) continue;

    const renamed = renameSection(line);
    const sanitized = sanitizeLine(renamed);
    if (sanitized) out.push(sanitized);
    else if (line.startsWith('#')) out.push(renameSection(line));
    inSensitiveBlock = false;
  }

  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
