// Entry point — routes to the right script based on $VERTICAL env var
import { writeFileSync, appendFileSync } from 'fs';
import { refreshScores }     from './scores.js';
import { refreshNews }       from './news.js';
import { refreshUpsets }     from './upsets.js';
import { refreshBracket }    from './bracket.js';
import { refreshNarratives } from './narratives.js';
import { refreshGoals }      from './goals.js';
import { buildDigest }       from './digest.js';

const vertical = (process.env.VERTICAL || 'all').toLowerCase();

const ALL = [refreshScores, refreshNews, refreshUpsets, refreshBracket, refreshNarratives, refreshGoals];

const MAP = {
  scores:     [refreshScores],
  news:       [refreshNews],
  upsets:     [refreshUpsets],
  bracket:    [refreshBracket],
  narratives: [refreshNarratives],
  goals:      [refreshGoals],
  all:        ALL,
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
