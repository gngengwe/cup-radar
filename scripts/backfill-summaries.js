#!/usr/bin/env node
// Pre-populates D1 with ESPN summaries for all finished matches in matches.json.
// Calls the deployed /api/summary GET endpoint — the read-through cache fetches
// from ESPN and stores in D1 on cache-miss, returns instantly on cache-hit.
//
// Usage:  node scripts/backfill-summaries.js
//         node scripts/backfill-summaries.js --site https://wc.ngengwe.com

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const SITE  = process.argv.includes('--site')
  ? process.argv[process.argv.indexOf('--site') + 1]
  : 'https://wc.ngengwe.com';

const ESPN_BOARD    = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_CODE_ALIAS = { BOS: 'BIH', HON: 'HND' };

function norm(code) { return ESPN_CODE_ALIAS[code] ?? code; }
function toDate(d)  { return d.replace(/-/g, ''); }
function sleep(ms)  { return new Promise(r => setTimeout(r, ms)); }

// Load matches
const raw  = readFileSync(join(__dir, '../src/data/matches.json'), 'utf8');
const data = JSON.parse(raw);
const all  = Array.isArray(data) ? data : (data.matches ?? Object.values(data)[0]);
const today = new Date().toISOString().slice(0, 10);

const finished = all.filter(m => m.date < today || m.status === 'finished');
console.log(`\nBackfilling ${finished.length} finished games via ${SITE}\n`);

// Group by date to fetch scoreboard once per date
const byDate = {};
for (const m of finished) {
  (byDate[m.date] ??= []).push(m);
}

let cached = 0, alreadyCached = 0, notFound = 0, failed = 0;

for (const [date, matches] of Object.entries(byDate).sort()) {
  console.log(`📅 ${date} (${matches.length} games)`);

  // Fetch ESPN scoreboard once for this date
  let events = [];
  try {
    const res = await fetch(`${ESPN_BOARD}?dates=${toDate(date)}`);
    if (res.ok) {
      const json = await res.json();
      events = json.events ?? [];
    }
  } catch (e) {
    console.log(`  ⚠ scoreboard fetch failed: ${e.message}`);
  }
  await sleep(300);

  for (const match of matches) {
    process.stdout.write(`  ${match.homeTeam} vs ${match.awayTeam}... `);

    // Find ESPN event ID by matching team codes
    let eventId = null;
    for (const ev of events) {
      const comp = ev.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === 'home');
      const away = comp?.competitors?.find(c => c.homeAway === 'away');
      if (
        norm(home?.team?.abbreviation) === match.homeCode &&
        norm(away?.team?.abbreviation) === match.awayCode
      ) { eventId = ev.id; break; }
    }

    if (!eventId) {
      console.log('⚠ no ESPN event found');
      notFound++;
      continue;
    }

    // Hit the cache endpoint — miss proxies ESPN + writes D1, hit returns instantly
    try {
      const res = await fetch(`${SITE}/api/summary?eventId=${eventId}`);
      if (res.ok) {
        const hit = res.headers.get('X-Cache');
        if (hit === 'HIT') {
          console.log('✓ already cached');
          alreadyCached++;
        } else {
          console.log('✓ fetched + cached');
          cached++;
        }
      } else {
        console.log(`✗ HTTP ${res.status}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${e.message}`);
      failed++;
    }

    await sleep(400); // rate-limit: ~2.5 reqs/s to ESPN via Worker
  }
}

console.log(`
Done.
  ✓ Newly cached : ${cached}
  ✓ Already there: ${alreadyCached}
  ⚠ Not on ESPN  : ${notFound}
  ✗ Failed       : ${failed}
`);
