/**
 * Copy Playwright-recorded showcase videos to marketing public/videos.
 * Run after: pnpm exec playwright test tests/specs/showcase-video.spec.ts --project=showcase-video --workers=1
 *
 * Expects test-results/showcase-video/<dir>/video.webm (two videos, created in order: light then dark).
 * Copies to apps/marketing/public/videos/dashboard-light.webm and dashboard-dark.webm.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptWebRoot = path.resolve(__dirname, '..');
const cwd = process.cwd();

function findTestResultsDir(): string | null {
  const candidates = [
    path.join(scriptWebRoot, 'test-results', 'showcase-video'),
    path.join(cwd, 'test-results', 'showcase-video'),
    path.join(cwd, 'apps', 'web', 'test-results', 'showcase-video'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

function getWebAppRoot(testResultsDir: string): string {
  return path.resolve(testResultsDir, '..', '..');
}

function main() {
  const TEST_RESULTS = findTestResultsDir();
  if (!TEST_RESULTS) {
    console.error('No test-results/showcase-video found. Record the videos first (from apps/web):');
    console.error('  pnpm exec playwright test tests/specs/showcase-video.spec.ts --project=showcase-video --workers=1');
    console.error('Then run this script again to copy them to the marketing site.');
    process.exit(1);
  }

  const WEB_APP_ROOT = getWebAppRoot(TEST_RESULTS);
  const OUT_DIR = path.resolve(WEB_APP_ROOT, '..', 'marketing', 'public', 'videos');

  const dirs = fs.readdirSync(TEST_RESULTS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      if (d.name.includes('..')) throw new Error('Invalid directory name');
      return path.join(TEST_RESULTS, d.name);
    })
    .filter((d) => fs.existsSync(path.join(d, 'video.webm')));

  const byMtime = dirs
    .map((d) => ({ dir: d, mtime: fs.statSync(path.join(d, 'video.webm')).mtimeMs }))
    .sort((a, b) => a.mtime - b.mtime);

  if (byMtime.length < 2) {
    console.error(`Expected 2 videos, found ${byMtime.length}. Run the showcase-video spec with --workers=1.`);
    process.exit(1);
  }

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const lightSrc = path.join(byMtime[0].dir, 'video.webm');
  const darkSrc = path.join(byMtime[1].dir, 'video.webm');
  const lightDest = path.join(OUT_DIR, 'dashboard-light.webm');
  const darkDest = path.join(OUT_DIR, 'dashboard-dark.webm');

  fs.copyFileSync(lightSrc, lightDest);
  fs.copyFileSync(darkSrc, darkDest);

  console.log('Copied:');
  console.log('  dashboard-light.webm');
  console.log('  dashboard-dark.webm');
  console.log(`to ${OUT_DIR}`);
}

main();
