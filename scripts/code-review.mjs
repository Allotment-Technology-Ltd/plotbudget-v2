#!/usr/bin/env node
/**
 * Automated code review: fails on forbidden patterns (e.g. @ts-ignore, disabling security).
 * Run before push and in CI. Aligns with .cursorrules and reviewer-persona expectations.
 */
import fs from "fs";
import path from "path";
import chalk from "chalk";

const FORBIDDEN_PATTERNS = [
  { pattern: /@ts-ignore/g, name: "@ts-ignore (use proper types)" },
  { pattern: /eslint-disable.*security/gi, name: "eslint-disable for security rules" },
  { pattern: /\beval\s*\(/g, name: "eval()" },
  { pattern: /dangerouslySetInnerHTML/g, name: "dangerouslySetInnerHTML" },
  { pattern: /innerHTML\s*=/g, name: "innerHTML assignment" },
  { pattern: /document\.write/g, name: "document.write" },
  { pattern: /new Function\s*\(/g, name: "new Function()" },
];

function walkDir(dir, ext, ignore, results) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.includes('..')) continue; // Skip entries with path traversal attempts
    const full = path.join(dir, e.name);
    if (ignore.has(e.name) || ignore.has(path.basename(full))) continue;
    if (e.isDirectory()) walkDir(full, ext, ignore, results);
    else if (ext.some((x) => e.name.endsWith(x))) results.push(full);
  }
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const hits = [];
  for (const { pattern, name } of FORBIDDEN_PATTERNS) {
    const m = content.match(pattern);
    if (m) hits.push({ name, count: m.length });
  }
  return hits;
}

const root = process.cwd();
const ignore = new Set(["node_modules", ".next", ".git", "dist", "build", "playwright-report", "test-results"]);
const exts = [".ts", ".tsx", ".js", ".jsx"];
const files = [];
walkDir(root, exts, ignore, files);

const failures = [];
for (const file of files) {
  const rel = path.relative(root, file);
  const hits = scanFile(file);
  if (hits.length > 0) {
    for (const { name, count } of hits) {
      failures.push({ file: rel, rule: name, count });
    }
  }
}

console.log(chalk.hex("#3b82f6").bold("\nAutomated code review\n"));

if (failures.length > 0) {
  console.log(chalk.red("✗ Forbidden pattern(s) found:\n"));
  for (const { file, rule, count } of failures) {
    console.log(chalk.gray("  " + file) + chalk.red(" – " + rule + (count > 1 ? ` (${count})` : "")));
  }
  console.log(chalk.yellow("\nFix or remove these before pushing. See .cursorrules and reviewer-persona.\n"));
  process.exit(1);
}

console.log(chalk.green("✓ No forbidden patterns; automated review passed.\n"));
process.exit(0);
