/**
 * Env load order: .env (prod) then .env.local (overrides for pre-prod).
 * Keep .env with production values and .env.local with dev/pre-prod; no switching.
 * See .env.example and .env.local.example.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env.local'), override: true });

module.exports = require('./app.json');
