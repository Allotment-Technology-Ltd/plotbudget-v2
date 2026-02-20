#!/usr/bin/env node
/**
 * Sanity's build expects styled-components to expose
 * dist/styled-components.browser.esm.js. When using the npm alias
 * styled-components@npm:@sanity/css-in-js, that package only has dist/browser.js.
 * This script creates the expected file as a re-export so `sanity build` / `sanity deploy` succeed.
 */
const fs = require('fs')
const path = require('path')

const distDir = path.join(
  process.cwd(),
  'node_modules',
  'styled-components',
  'dist'
)
const browserPath = path.join(distDir, 'browser.js')
const targetPath = path.join(distDir, 'styled-components.browser.esm.js')

if (!fs.existsSync(browserPath)) {
  // Not using @sanity/css-in-js alias, or different layout; skip
  process.exit(0)
}

const reexport = `export * from './browser.js';\nexport { default } from './browser.js';\n`
fs.writeFileSync(targetPath, reexport, 'utf8')
