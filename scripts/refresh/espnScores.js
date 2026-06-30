// Fills in knockout-match results from ESPN's public scoreboard API.
//
// scores.js (football-data.org) is the primary score source for group-stage
// matches, but knockout fixtures aren't reliably appearing there yet (the
// provider's own fixture data seems to lag behind real team-name resolution).
// ESPN's hidden scoreboard endpoint is unauthenticated and already used
// client-side (src/api/espnScoreboard.js) for live "Today's Action" — this
// mirrors that same lookup server-side so bracket.json / matches.json catch
// up even when nobody has the landing page open.

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '../../src/data');

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const ESPN_CODE_ALIAS = { BOS: 'BIH', HON: 'HND' };

const normalizeEspnCode = code => ESPN_CODE_ALIAS[code] ?? code;
const toEspnDate = d => d.replace(/-/g, '');

export async function refreshEspnScores() {
  console.log('[espnScores] checking ESPN for knockout results…');
  const summary = { vertical: 'espnScores', applied: [], pending: [], flags: [] };

  const matchFile = join(DATA, 'matches.json');
  const doc = JSON.parse(readFileSync(matchFile, 'utf8'));

  const unresolved = doc.matches.filter(m =>
    m.stage !== 'Group Stage' && m.status !== 'finished' &&
    m.homeCode !== 'TBD' && m.awayCode !== 'TBD'
  );
  if (!unresolved.length) { console.log('[espnScores] nothing to check'); return summary; }

  const byDate = {};
  for (const m of unresolved) (byDate[m.date] ??= []).push(m);

  let updated = 0;

  for (const [date, ms] of Object.entries(byDate)) {
    let events;
    try {
      const res = await fetch(`${BASE}?dates=${toEspnDate(date)}`);
      if (!res.ok) { summary.flags.push(`ESPN scoreboard ${date}: HTTP ${res.status}`); continue; }
      events = (await res.json()).events || [];
    } catch (err) {
      summary.flags.push(`ESPN scoreboard ${date}: ${err.message}`);
      continue;
    }

    for (const m of ms) {
      const event = events.find(e => {
        const comp = e.competitions?.[0];
        if (!comp) return false;
        const home = comp.competitors.find(c => c.homeAway === 'home');
        const away = comp.competitors.find(c => c.homeAway === 'away');
        return normalizeEspnCode(home?.team?.abbreviation) === m.homeCode
            && normalizeEspnCode(away?.team?.abbreviation) === m.awayCode;
      });
      if (!event) continue;

      const comp = event.competitions[0];
      const state = comp.status.type.state; // 'pre' | 'in' | 'post'
      if (state === 'pre') continue; // not kicked off yet — leave scores as null

      const home = comp.competitors.find(c => c.homeAway === 'home');
      const away = comp.competitors.find(c => c.homeAway === 'away');
      const newStatus = state === 'post' ? 'finished' : 'live';
      const homeScore = Number(home.score);
      const awayScore = Number(away.score);
      // Knockout matches level after 90/120 min go to penalties — ESPN flags
      // the shootout winner explicitly since the scoreline alone is a draw.
      const winner = home.winner ? 'home' : away.winner ? 'away' : null;

      if (m.status !== newStatus || m.homeScore !== homeScore || m.awayScore !== awayScore || m.winner !== winner) {
        m.status    = newStatus;
        m.homeScore = Number.isFinite(homeScore) ? homeScore : null;
        m.awayScore = Number.isFinite(awayScore) ? awayScore : null;
        if (winner) m.winner = winner;
        updated++;
        const note = winner && homeScore === awayScore ? ` (${winner} won on penalties)` : '';
        summary.applied.push(`${m.homeTeam} ${m.homeScore}–${m.awayScore} ${m.awayTeam} → ${newStatus}${note}`);
      }
    }
  }

  if (updated > 0) {
    doc.lastUpdated = new Date().toISOString();
    writeFileSync(matchFile, JSON.stringify(doc, null, 2) + '\n');
    console.log(`[espnScores] updated ${updated} match(es)`);
  } else {
    console.log('[espnScores] no changes');
  }

  return summary;
}
