// Entry point — routes to the right script based on $VERTICAL env var
import { writeFileSync, appendFileSync } from 'fs';
import { refreshScores }       from './scores.js';
import { refreshEspnScores }   from './espnScores.js';
import { refreshNews }         from './news.js';
import { refreshUpsets }       from './upsets.js';
import { refreshBracket }      from './bracket.js';
import { refreshQualifiers }   from './qualifiers.js';
import { refreshKnockoutSync } from './knockoutSync.js';
import { refreshNarratives }   from './narratives.js';
import { refreshGoals }        from './goals.js';
import { buildDigest }         from './digest.js';

const vertical = (process.env.VERTICAL || 'all').toLowerCase();

// Order matters: scores (football-data.org, group stage) → espnScores
// (ESPN public scoreboard, fills in knockout results scores.js misses) →
// bracket (promotes finished matches into bracket.json) → qualifiers
// (resolves group-stage placeholders into bracket) → knockoutSync (pushes
// resolved bracket names back down into matches.json) → narratives/goals
// (consume the now-accurate matches.json data).
const ALL = [refreshScores, refreshEspnScores, refreshNews, refreshUpsets, refreshBracket, refreshQualifiers, refreshKnockoutSync, refreshNarratives, refreshGoals];

const MAP = {
  scores:        [refreshScores],
  espnscores:    [refreshEspnScores],
  news:          [refreshNews],
  upsets:        [refreshUpsets],
  bracket:       [refreshBracket],
  qualifiers:    [refreshQualifiers],
  knockoutsync:  [refreshKnockoutSync],
  narratives:    [refreshNarratives],
  goals:         [refreshGoals],
  all:           ALL,
};

const tasks = MAP[vertical] || ALL;

console.log(`\n── Cup Radar refresh: ${vertical} ──`);
const results = [];
for (const task of tasks) {
  try {
    const summary = await task();
    results.push(summary || { vertical: task.name, applied: [], pending: [], flags: [] });
  } catch (err) {
    console.error(`[${task.name}] FAILED:`, err.message);
    results.push({ vertical: task.name, applied: [], pending: [], flags: [], error: err.message });
  }
}
console.log('── Done ──\n');

const digest = buildDigest(results);
if (digest) {
  writeFileSync('ops-digest.md', digest);
  console.log('Digest written to ops-digest.md');
}
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `has_digest=${digest ? 'true' : 'false'}\n`);
}
