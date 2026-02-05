// apps/web/tests/auth-state-path.ts
// Single source of truth: path is relative to THIS file so config and setup always match.
import path from 'path';
import { fileURLToPath } from 'url';

function getDirname(): string {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return (typeof __dirname !== 'undefined' ? __dirname : path.join(process.cwd(), 'tests')) as string;
  }
}

export const authStatePath = path.join(getDirname(), '.auth', 'solo.json');
