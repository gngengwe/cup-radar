// Backfills per-goal scorer/minute data for finished matches that football-data.org
// doesn't provide (free tier is score-only). Reuses the same ESPN summary pipeline
// Live Pulse already relies on for live goal events.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { fetchEspnScoreboard, matchEspnEventId } from '../../src/api/espnScoreboard.js';
import { normalizeEspnSoccerSummary } from '../../src/utils/normalizeEspnSoccerSummary.js';
import { matchKickoffISO } from '../../src/utils/time.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '../../src/data');

const SUMMARY_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';
const GOAL_FAMILIES = ['goal', 'header-goal', 'penalty', 'own-goal'];

async function fetchSummary(eventId) {
  const res = await fetch(`${SUMMARY_BASE}?event=${eventId}`);
  if (!res.ok) throw new Error(`ESPN summary ${res.status}`);
  return res.json();
}

export async function refreshGoals() {
  console.log('[goals] backfilling scorers from ESPN summaries…');

  const summary = { vertical: 'goals', applied: [], pending: [], flags: [] };

  const file    = join(DATA, 'matches.json');
  const current = JSON.parse(readFileSync(file, 'utf8'));

  const missing = current.matches.filter(m =>
    m.status === 'finished' && !m.goals?.length && (m.homeScore + m.awayScore) > 0
  );
  if (!missing.length) { console.log('[goals] nothing to backfill'); return summary; }

  const scoreboardByDate = new Map();
  let updated = 0;

  for (const match of missing) {
    const label = `${match.homeTeam} ${match.homeScore}–${match.awayScore} ${match.awayTeam} (${match.date})`;
    try {
      // ESPN's scoreboard buckets events by UTC calendar day, not the match's
      // local date — a late local kickoff (e.g. 22:00 CT, 21:00 PT) can land
      // on the next UTC day, so querying by match.date alone misses it.
      const espnDateStr = matchKickoffISO(match).slice(0, 10);
      let events = scoreboardByDate.get(espnDateStr);
      if (!events) {
        events = await fetchEspnScoreboard(espnDateStr);
        scoreboardByDate.set(espnDateStr, events);
      }

      const eventId = matchEspnEventId(events, match);
      if (!eventId) {
        summary.flags.push(`${label}: no matching ESPN event found — can't backfill yet.`);
        continue;
      }

      const raw        = await fetchSummary(eventId);
      const normalized = normalizeEspnSoccerSummary(raw, match);

      // ESPN's own boxscore is the authoritative home/away map — team display
      // names in play text often differ from ours (e.g. "United States" vs "USA").
      const teamHomeAway = new Map();
      for (const t of raw.boxscore?.teams || []) {
        const name = t.team?.displayName || t.team?.name;
        if (name) teamHomeAway.set(name, t.homeAway);
      }

      const goalEvents = normalized.events.filter(ev =>
        GOAL_FAMILIES.includes(ev.family) && !/^penalty missed/i.test(ev.text)
      );

      if (!goalEvents.length) {
        summary.flags.push(`${label}: ESPN summary has no goal events yet — will retry next run.`);
        continue;
      }

      const goals = goalEvents
        .map(ev => {
          const side   = teamHomeAway.get(ev.teamName) ?? (ev.teamName === match.homeTeam ? 'home' : 'away');
          const goal = { minute: ev.minute ?? 0, team: side, player: ev.scorer || 'Unknown' };
          if (ev.family === 'own-goal') goal.note = 'og';
          if (ev.family === 'penalty')  goal.note = 'pen';
          return goal;
        })
        .sort((a, b) => a.minute - b.minute);

      match.goals = goals;
      updated++;

      const homeGoals = goals.filter(g => g.team === 'home').length;
      const awayGoals = goals.filter(g => g.team === 'away').length;
      if (homeGoals === match.homeScore && awayGoals === match.awayScore) {
        summary.applied.push(`${label}: backfilled ${goals.length} goal${goals.length === 1 ? '' : 's'}`);
      } else {
        summary.flags.push(`${label}: backfilled ${goals.length} goal${goals.length === 1 ? '' : 's'} but scorer count (${homeGoals}-${awayGoals}) doesn't match the final score — check for a missed event.`);
      }
    } catch (err) {
      summary.flags.push(`${label}: ${err.message}`);
    }
  }

  if (updated > 0) {
    current.lastUpdated = new Date().toISOString();
    writeFileSync(file, JSON.stringify(current, null, 2) + '\n');
    console.log(`[goals] backfilled ${updated} matches`);
  } else {
    console.log('[goals] no matches backfilled this run');
  }

  return summary;
}
