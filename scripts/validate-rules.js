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
if (!data || typeof data !== 'object' || Array.isArray(data)) {
  console.error('💥 rules.yaml root should be a YAML mapping (object)');
  process.exit(1);
}
if (!data.rules || !Array.isArray(data.rules)) {
  console.error('💥 rules.yaml is missing a "rules" array');
  process.exit(1);
}
const names = new Set();
for (let i = 0; i < data.rules.length; i++) {
  const entry = data.rules[i];
  if (!entry || typeof entry !== 'object') {
    console.error(`💥 rules[${i}] is not an object`);
    process.exit(1);
  }
  const { id, description, severity, scope } = entry;
  if (typeof id !== 'string' || id.trim() === '') {
    console.error(`💥 rules[${i}] is missing an id`);
    process.exit(1);
  }
  if (names.has(id)) {
    console.error(`💥 duplicate rule id: ${id}`);
    process.exit(1);
  }
  names.add(id);
  if (typeof description !== 'string' || description.trim() === '') {
    console.error(`💥 rule '${id}' is missing a description`);
    process.exit(1);
  }
  if (typeof severity !== 'string' || !['error', 'warning'].includes(severity)) {
    console.error(`💥 rule '${id}' severity must be 'error' or 'warning'`);
    process.exit(1);
  }
  if (typeof scope !== 'string' || scope.trim() === '') {
    console.error(`💥 rule '${id}' is missing a scope`);
    process.exit(1);
  }
}
console.log('✅ rules.yaml validated (' + data.rules.length + ' rules)');
