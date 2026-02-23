#!/usr/bin/env node
// Validator for rules.yaml — CI performance & correctness gating rules for apps/web
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
  console.error('💥 rules.yaml root should be a YAML mapping (object) with thresholds, rules, and notes keys');
  process.exit(1);
}

// Validate thresholds
if (!data.thresholds || typeof data.thresholds !== 'object') {
  console.error('💥 rules.yaml is missing a "thresholds" object');
  process.exit(1);
}

// Validate rules array
if (!Array.isArray(data.rules) || data.rules.length === 0) {
  console.error('💥 rules.yaml "rules" must be a non-empty array');
  process.exit(1);
}

const ids = new Set();
for (let i = 0; i < data.rules.length; i++) {
  const rule = data.rules[i];
  if (!rule || typeof rule !== 'object') {
    console.error(`💥 rules[${i}] is not an object`);
    process.exit(1);
  }
  const { id, description, severity } = rule;
  if (typeof id !== 'string' || id.trim() === '') {
    console.error(`💥 rules[${i}] is missing an id`);
    process.exit(1);
  }
  if (ids.has(id)) {
    console.error(`💥 duplicate rule id: ${id}`);
    process.exit(1);
  }
  ids.add(id);
  if (typeof description !== 'string' || description.trim() === '') {
    console.error(`💥 rule '${id}' is missing a description`);
    process.exit(1);
  }
  if (severity !== 'error' && severity !== 'warning') {
    console.error(`💥 rule '${id}' has invalid severity '${severity}' (must be 'error' or 'warning')`);
    process.exit(1);
  }
}

console.log(`✅ rules.yaml validated (${data.rules.length} rules, ${Object.keys(data.thresholds).length} thresholds)`);

