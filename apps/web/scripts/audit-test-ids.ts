// apps/web/scripts/audit-test-ids.ts
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const INTERACTIVE_PATTERNS = [
  /onClick\s*=/,
  /onChange\s*=/,
  /onSubmit\s*=/,
  /<Button\s/,
  /<Input\s/,
  /<Select\s/,
  /<Link\s/,
  /<form\s/,
];

const TEST_ID_PATTERN = /data-testid\s*=/;

async function scanFile(filePath: string): Promise<string[]> {
  const content = await readFile(filePath, 'utf-8');
  const violations: string[] = [];

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line has interactive element
    const hasInteractive = INTERACTIVE_PATTERNS.some((pattern) => pattern.test(line));

    if (hasInteractive) {
      // Check if this element or next few lines have data-testid
      const context = lines.slice(i, i + 5).join('\n');

      if (!TEST_ID_PATTERN.test(context)) {
        violations.push(`${filePath}:${i + 1} - Missing data-testid`);
      }
    }
  }

  return violations;
}

async function scanDirectory(dir: string): Promise<string[]> {
  let entries: { name: string; isDirectory: () => boolean }[];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const violations: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      violations.push(...(await scanDirectory(fullPath)));
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) {
      violations.push(...(await scanFile(fullPath)));
    }
  }

  return violations;
}

async function main() {
  console.log('🔍 Scanning for missing data-testid attributes...\n');

  const appDir = join(process.cwd(), 'app');
  const componentsDir = join(process.cwd(), 'components');
  const packagesUiDir = join(process.cwd(), '../packages/ui');

  const componentsViolations = await scanDirectory(appDir);
  const componentsViolations2 = await scanDirectory(componentsDir);
  const packagesViolations = await scanDirectory(packagesUiDir);

  const allViolations = [...componentsViolations, ...componentsViolations2, ...packagesViolations];

  if (allViolations.length === 0) {
    console.log('✅ All interactive elements have data-testid attributes!');
  } else {
    console.log(`❌ Found ${allViolations.length} violations:\n`);
    allViolations.forEach((v) => console.log(v));
    process.exit(1);
  }
}

main();
