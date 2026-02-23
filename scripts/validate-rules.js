#!/usr/bin/env node
// simple validator for rules.yaml
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const file = path.join(__dirname, '..', 'rules.yaml');
let data;
try {
  const content = fs.readFileSync(file, 'utf8');
  data = yaml.load(content);
} catch (e) {
  console.error('💥 failed to load rules.yaml:', e.message);
  process.exit(1);
}
if (!Array.isArray(data)) {
  console.error('💥 rules.yaml root should be a YAML sequence (array)');
  process.exit(1);
}
const names = new Set();
for (let i = 0; i < data.length; i++) {
  const entry = data[i];
  if (!entry || typeof entry !== 'object') {
    console.error(`💥 entry at index ${i} is not an object`);
    process.exit(1);
  }
  const { name, context, description, content } = entry;
  if (typeof name !== 'string' || name.trim() === '') {
    console.error(`💥 entry at index ${i} is missing a name`);
    process.exit(1);
  }
  if (names.has(name)) {
    console.error(`💥 duplicate rule name: ${name}`);
    process.exit(1);
  }
  names.add(name);
  if (typeof context !== 'string' || context.trim() === '') {
    console.error(`💥 entry '${name}' is missing a context`);
    process.exit(1);
  }
  if (typeof description !== 'string' || description.trim() === '') {
    console.error(`💥 entry '${name}' is missing a description`);
    process.exit(1);
  }
  if (typeof content !== 'string' || content.trim() === '') {
    console.error(`💥 entry '${name}' is missing content`);
    process.exit(1);
  }
}
console.log('✅ rules.yaml validated (' + data.length + ' entries)');
