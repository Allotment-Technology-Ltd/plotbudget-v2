import fs from "fs";
import path from "path";
import chalk from "chalk";

const SECRET_PATTERNS = [
  /(?:api[_-]?key|apikey)\s*[:=]\s*["'`][^"'`]+["'`]/gi,
  /(?:password|passwd|pwd)\s*[:=]\s*["'`][^"'`]+["'`]/gi,
  /(?:secret|token)\s*[:=]\s*["'`][^"'`]+["'`]/gi,
  /[a-zA-Z0-9_-]{20,}/g,
];

const DANGEROUS_PATTERNS = [
  { pattern: /\beval\s*\(/g, name: "eval()" },
  { pattern: /dangerouslySetInnerHTML/g, name: "dangerouslySetInnerHTML" },
  { pattern: /innerHTML\s*=/g, name: "innerHTML" },
  { pattern: /document\.write/g, name: "document.write" },
  { pattern: /new Function\s*\(/g, name: "new Function()" },
];

function scanFile(filePath: string): { secrets: number; dangerous: string[] } {
  const content = fs.readFileSync(filePath, "utf8");
  let secrets = 0;
  for (const re of SECRET_PATTERNS) {
    const m = content.match(re);
    if (m) secrets += m.length;
  }
  const dangerous: string[] = [];
  for (const { pattern, name } of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) dangerous.push(name);
  }
  return { secrets, dangerous };
}

function walkDir(dir: string, ext: string[], ignore: Set<string>, results: string[]): void {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (ignore.has(e.name) || ignore.has(path.basename(full))) continue;
    if (e.isDirectory()) walkDir(full, ext, ignore, results);
    else if (ext.some((x) => e.name.endsWith(x))) results.push(full);
  }
}

const root = process.cwd();
const ignore = new Set(["node_modules", ".next", ".git", "dist", "build"]);
const files: string[] = [];
walkDir(root, [".ts", ".tsx", ".js", ".jsx"], ignore, files);

let totalSecrets = 0;
const allDangerous: { file: string; patterns: string[] }[] = [];

for (const file of files) {
  const rel = path.relative(root, file);
  const { secrets, dangerous } = scanFile(file);
  if (secrets > 0 || dangerous.length > 0) {
    totalSecrets += secrets;
    if (dangerous.length) allDangerous.push({ file: rel, patterns: dangerous });
  }
}

console.log(chalk.hex("#3b82f6").bold("\nRestormel Security Audit\n"));
if (totalSecrets > 0) {
  console.log(chalk.yellow("⚠ Potential secret(s) found: " + totalSecrets));
}
if (allDangerous.length > 0) {
  console.log(chalk.yellow("⚠ Dangerous pattern(s):"));
  for (const { file, patterns } of allDangerous) {
    console.log(chalk.gray("  " + file + ": ") + patterns.join(", "));
  }
}
if (totalSecrets === 0 && allDangerous.length === 0) {
  console.log(chalk.green("✓ No obvious secrets or dangerous patterns detected."));
}
console.log("");
