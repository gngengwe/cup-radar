// ─── ESPN scoreboard (undocumented, CORS-open) ────────────────────────────────
// Unlike football-data.org, ESPN's hidden scoreboard JSON sends
// "Access-Control-Allow-Origin: *", so it can be fetched directly from the
// browser on the deployed site. No API key, but it's unofficial — treat as a
// best-effort live-status source and fall back gracefully if it errors.

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

function toEspnDate(dateStr) {
  return dateStr.replace(/-/g, ''); // "2026-06-13" -> "20260613"
}

/**
 * Looks up live status for a match by date + team codes.
 * Returns { state: 'pre'|'in'|'post', clock, homeScore, awayScore } or null
 * if the match isn't found (or the fetch fails).
 */
export async function fetchEspnMatchStatus(match) {
  const res = await fetch(`${BASE}?dates=${toEspnDate(match.date)}`);
  if (!res.ok) throw new Error(`ESPN scoreboard ${res.status}`);

  const data   = await res.json();
  const events = data.events || [];

  for (const event of events) {
    const comp = event.competitions?.[0];
    if (!comp) continue;

    const home = comp.competitors.find(c => c.homeAway === 'home');
    const away = comp.competitors.find(c => c.homeAway === 'away');
    if (home?.team?.abbreviation !== match.homeCode || away?.team?.abbreviation !== match.awayCode) continue;

    return {
      state:     comp.status.type.state, // 'pre' | 'in' | 'post'
      clock:     comp.status.displayClock,
      homeScore: Number(home.score),
      awayScore: Number(away.score),
    };
  }

  return null;
}
