#!/usr/bin/env node
/**
 * Minimal HTTP server that runs the RecipeRadar update script when it receives
 * a POST with the correct secret. Run on the same host as the Docker stack so
 * the update script can run there. Used by GitHub Actions (schedule or manual)
 * to trigger updates without a self-hosted runner.
 *
 * Usage (on host that runs RecipeRadar):
 *   RECIPERADAR_UPDATE_SECRET=your-secret RECIPERADAR_UPDATE_PORT=9090 node tools/reciperadar/update-webhook.js
 *
 * Then in GitHub repo secrets set:
 *   RECIPERADAR_UPDATE_WEBHOOK_URL = https://your-host:9090/update (or http if no TLS)
 *   RECIPERADAR_UPDATE_SECRET     = same secret
 *
 * Requires Node 18+. No npm install (uses built-in http and child_process).
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SECRET = process.env.RECIPERADAR_UPDATE_SECRET;
const PORT = parseInt(process.env.RECIPERADAR_UPDATE_PORT || '9090', 10);
const SCRIPT_DIR = path.resolve(__dirname);
const UPDATE_SCRIPT = path.join(SCRIPT_DIR, 'update.sh');

if (!SECRET || SECRET.length < 16) {
  console.error('Set RECIPERADAR_UPDATE_SECRET (min 16 chars) in the environment.');
  process.exit(1);
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || (req.url && req.url.split('?')[0] !== '/update')) {
    send(res, 404, { error: 'Not found' });
    return;
  }

  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== SECRET) {
    send(res, 401, { error: 'Unauthorized' });
    return;
  }

  if (!fs.existsSync(UPDATE_SCRIPT)) {
    send(res, 500, { error: 'update.sh not found' });
    return;
  }

  send(res, 200, { ok: true, message: 'Update started' });

  const child = spawn('bash', [UPDATE_SCRIPT], {
    cwd: SCRIPT_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  child.unref();
  child.stdout?.on('data', (d) => process.stdout.write(d));
  child.stderr?.on('data', (d) => process.stderr.write(d));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`RecipeRadar update webhook listening on port ${PORT}`);
});
