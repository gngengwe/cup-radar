// Pushes resolved team names (and scores/status for finished matches) from
// bracket.json into the corresponding city-specific knockout entries in
// matches.json.  This is the reverse direction of bracket.js: bracket.js
// promotes matches.json results UP into bracket.json; knockoutSync.js
// pushes bracket.json knowledge DOWN so that Today/Tomorrow Action,
// LivePulse, and Goal Radar always show real team names instead of "TBD".
//
// Matching strategy: for each unresolved matches.json KO entry (homeTeam
// still "TBD"), find the bracket.json slot that shares the same date and
// city.  If that slot has real (non-placeholder) team names, copy them
// across together with flag/code.

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '../../src/data');

function isPlaceholder(s) {
  return !s || /^(TBD|Winner |Loser )/i.test(s);
}

export async function refreshKnockoutSync() {
  console.log('[knockoutSync] syncing bracket team names into matches.json…');

  const summary = { vertical: 'knockoutSync', applied: [], pending: [], flags: [] };

  const matchFile   = join(DATA, 'matches.json');
  const bracketFile = join(DATA, 'bracket.json');

  const matchesDoc = JSON.parse(readFileSync(matchFile, 'utf8'));
  const bracket    = JSON.parse(readFileSync(bracketFile, 'utf8'));

  // Build lookup: "date|city" → bracket slot
  const bracketByDateCity = {};
  for (const round of bracket.rounds) {
    for (const slot of round.matches) {
      if (slot.city && slot.city !== 'TBD') {
        const key = `${slot.date}|${slot.city}`;
        bracketByDateCity[key] = slot;
      }
    }
  }

  // Build a name→code lookup from the bracket FLAGS map (codes used by
  // matches.json for team matching in scores.js).
  const groups = JSON.parse(readFileSync(join(DATA, 'groups.json'), 'utf8'));
  const nameToCode = {};
  groups.groups.forEach(g => g.teams.forEach(t => { nameToCode[t.name] = t.code; }));

  let updated = 0;

  for (const m of matchesDoc.matches) {
    if (m.stage === 'Group Stage') continue;
    if (!isPlaceholder(m.homeTeam) && !isPlaceholder(m.awayTeam)) continue;

    const key = `${m.date}|${m.city}`;
    const slot = bracketByDateCity[key];
    if (!slot) {
      summary.pending.push(`${m.id} (${m.date} ${m.city}) — no matching bracket slot`);
      continue;
    }

    if (isPlaceholder(slot.home) || isPlaceholder(slot.away)) {
      summary.pending.push(`${m.id} → bracket slot ${slot.id} still has placeholder teams`);
      continue;
    }

    // Real team names available — copy across
    m.homeTeam = slot.home;
    m.homeFlag = slot.homeFlag;
    m.homeCode = nameToCode[slot.home] || 'TBD';

    m.awayTeam = slot.away;
    m.awayFlag = slot.awayFlag;
    m.awayCode = nameToCode[slot.away] || 'TBD';

    // If bracket slot already has a final score, carry it over too
    if (slot.status === 'finished' && slot.homeScore != null && slot.awayScore != null) {
      m.homeScore = slot.homeScore;
      m.awayScore = slot.awayScore;
      m.status    = 'finished';
    }

    updated++;
    summary.applied.push(`${m.id} (${m.city} ${m.date}): ${slot.home} vs ${slot.away}`);
  }

  if (updated > 0) {
    matchesDoc.lastUpdated = new Date().toISOString();
    writeFileSync(matchFile, JSON.stringify(matchesDoc, null, 2) + '\n');
    console.log(`[knockoutSync] updated ${updated} match(es) in matches.json`);
  } else {
    console.log('[knockoutSync] no matches.json changes');
  }

  return summary;
}
