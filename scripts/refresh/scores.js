import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '../../src/data');

const API_KEY = process.env.FOOTBALL_API_KEY;
const BASE    = 'https://api.football-data.org/v4';
const COMP    = 2000;

function normaliseStatus(s) {
  const map = { SCHEDULED:'scheduled', TIMED:'scheduled', IN_PLAY:'live',
                PAUSED:'live', FINISHED:'finished', POSTPONED:'postponed' };
  return map[s] || 'scheduled';
}

export async function refreshScores() {
  console.log('[scores] fetching from football-data.org…');

  const summary = { vertical: 'scores', applied: [], pending: [], flags: [] };

  if (!API_KEY) {
    console.log('[scores] No FOOTBALL_API_KEY — skipping');
    summary.flags.push('FOOTBALL_API_KEY secret is not set — live scores are not syncing.');
    return summary;
  }

  const res  = await fetch(`${BASE}/competitions/${COMP}/matches?season=2026`,
    { headers: { 'X-Auth-Token': API_KEY } });

  if (res.status === 429) { console.log('[scores] rate-limited, skipping'); return summary; }
  if (!res.ok)            throw new Error(`API ${res.status}`);

  const { matches: apiMatches } = await res.json();

  // Load existing
  const file    = join(DATA, 'matches.json');
  const current = JSON.parse(readFileSync(file, 'utf8'));

  let updated = 0;
  for (const api of apiMatches) {
    // Match by venue + date since our IDs differ from theirs
    const local = current.matches.find(m =>
      m.date === new Date(api.utcDate).toISOString().split('T')[0] &&
      (m.homeTeam?.toLowerCase() === api.homeTeam?.name?.toLowerCase() ||
       m.homeCode === api.homeTeam?.tla)
    );
    if (!local) continue;

    const newStatus = normaliseStatus(api.status);
    const newHome   = api.score?.fullTime?.home ?? null;
    const newAway   = api.score?.fullTime?.away ?? null;

    if (local.status !== newStatus || local.homeScore !== newHome || local.awayScore !== newAway) {
      local.status    = newStatus;
      local.homeScore = newHome;
      local.awayScore = newAway;
      updated++;
      const score = (newHome ?? newAway) !== null ? `${newHome}–${newAway}` : 'vs';
      summary.applied.push(`${local.homeTeam} ${score} ${local.awayTeam} → ${newStatus}`);
    }
  }

  if (updated > 0) {
    current.lastUpdated = new Date().toISOString();
    writeFileSync(file, JSON.stringify(current, null, 2) + '\n');
    console.log(`[scores] updated ${updated} matches`);
  } else {
    console.log('[scores] no score changes');
  }

  return summary;
}
