#!/usr/bin/env tsx
/**
 * Token Validation
 * Ensures generated token files are in sync with the source config
 * Run in CI to catch manual edits to generated files
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const SRC_DIR = join(__dirname, '../src');

function main() {
  console.log('🔍 Validating design tokens...\n');

  // Check files exist
  const cssPath = join(SRC_DIR, 'tokens.css');
  const tsPath = join(SRC_DIR, 'native.ts');
  const configPath = join(SRC_DIR, 'tokens.config.ts');

  if (!existsSync(cssPath)) {
    console.error('❌ ERROR: tokens.css not found');
    process.exit(1);
  }

  if (!existsSync(tsPath)) {
    console.error('❌ ERROR: native.ts not found');
    process.exit(1);
  }

  if (!existsSync(configPath)) {
    console.error('❌ ERROR: tokens.config.ts not found');
    process.exit(1);
  }

  // Read current file contents
  const currentCss = readFileSync(cssPath, 'utf-8');
  const currentTs = readFileSync(tsPath, 'utf-8');

  // Generate fresh tokens
  console.log('  Regenerating tokens from config...');
  try {
    execSync('pnpm generate-tokens', { 
      cwd: join(__dirname, '..'),
      stdio: 'pipe',
    });
  } catch (e) {
    console.error('❌ ERROR: Failed to generate tokens');
    process.exit(1);
  }

  // Read newly generated contents
  const newCss = readFileSync(cssPath, 'utf-8');
  const newTs = readFileSync(tsPath, 'utf-8');

  // Compare
  let hasErrors = false;

  if (currentCss !== newCss) {
    console.error('❌ ERROR: tokens.css is out of sync with tokens.config.ts');
    console.error('   Run: pnpm generate-tokens');
    hasErrors = true;
  } else {
    console.log('✅ tokens.css is in sync');
  }

  if (currentTs !== newTs) {
    console.error('❌ ERROR: native.ts is out of sync with tokens.config.ts');
    console.error('   Run: pnpm generate-tokens');
    hasErrors = true;
  } else {
    console.log('✅ native.ts is in sync');
  }

  if (hasErrors) {
    console.error('\n🚨 Token validation failed!');
    console.error('   Generated files do not match the source config.');
    console.error('   Please run: pnpm generate-tokens\n');
    process.exit(1);
  }

  console.log('\n✨ Token validation passed!');
  console.log('   All generated files are in sync with tokens.config.ts\n');
}

main();
