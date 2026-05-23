// Entry point — routes to the right script based on $VERTICAL env var
import { refreshScores }     from './scores.js';
import { refreshNews }       from './news.js';
import { refreshUpsets }     from './upsets.js';
import { refreshBracket }    from './bracket.js';
import { refreshNarratives } from './narratives.js';

const vertical = (process.env.VERTICAL || 'all').toLowerCase();

const ALL = [refreshScores, refreshNews, refreshUpsets, refreshBracket, refreshNarratives];

const MAP = {
  scores:     [refreshScores],
  news:       [refreshNews],
  upsets:     [refreshUpsets],
  bracket:    [refreshBracket],
  narratives: [refreshNarratives],
  all:        ALL,
};

const tasks = MAP[vertical] || ALL;

console.log(`\n── Cup Radar refresh: ${vertical} ──`);
for (const task of tasks) {
  try {
    await task();
  } catch (err) {
    console.error(`[${task.name}] FAILED:`, err.message);
  }
}
console.log('── Done ──\n');
