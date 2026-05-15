#!/usr/bin/env node
/**
 * stamp.js — update lastUpdated timestamp in Cup Radar data files
 *
 * Usage:
 *   node scripts/stamp.js              → stamps ALL data files that have lastUpdated
 *   node scripts/stamp.js alerts       → stamps src/data/alerts.json only
 *   node scripts/stamp.js news tickets → stamps multiple files
 *
 * Or via npm:
 *   npm run stamp                      → all files
 *   npm run stamp -- alerts            → alerts.json only
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const DATA_DIR = resolve(process.cwd(), 'src', 'data');
const now      = new Date().toISOString();

// Files to stamp: either named args or all .json files in data/
const args    = process.argv.slice(2);
const targets = args.length > 0
  ? args.map(a => a.endsWith('.json') ? a : `${a}.json`)
  : readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

let stamped = 0, skipped = 0, errors = 0;

for (const file of targets) {
  const filePath = join(DATA_DIR, file);
  try {
    const raw  = readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);

    if ('lastUpdated' in data) {
      data.lastUpdated = now;
      writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`  ✓  ${file.padEnd(30)} → ${now}`);
      stamped++;
    } else {
      console.log(`  –  ${file.padEnd(30)} no lastUpdated field (skipped)`);
      skipped++;
    }
  } catch (e) {
    console.error(`  ✗  ${file.padEnd(30)} ${e.message}`);
    errors++;
  }
}

console.log(`\n  ${stamped} stamped · ${skipped} skipped · ${errors} errors`);
if (errors > 0) process.exit(1);
