// ─── ESPN scoreboard (undocumented, CORS-open) ────────────────────────────────
// Unlike football-data.org, ESPN's hidden scoreboard JSON sends
// "Access-Control-Allow-Origin: *", so it can be fetched directly from the
// browser on the deployed site. No API key, but it's unofficial — treat as a
// best-effort live-status source and fall back gracefully if it errors.

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const SUMMARY_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';
const ESPN_CODE_ALIAS = {
  BOS: 'BIH',
  HON: 'HND',
  GRE: 'GRE',
};

function normalizeEspnCode(code) {
  return ESPN_CODE_ALIAS[code] ?? code;
}

function toEspnDate(dateStr) {
  return dateStr.replace(/-/g, ''); // "2026-06-13" -> "20260613"
}

/**
 * Fetches ESPN's scoreboard events for a given date ("YYYY-MM-DD").
 * Returns the raw `events` array — pass to matchEspnStatus() per match.
 */
export async function fetchEspnScoreboard(dateStr) {
  const res = await fetch(`${BASE}?dates=${toEspnDate(dateStr)}`);
  if (!res.ok) throw new Error(`ESPN scoreboard ${res.status}`);

  const data = await res.json();
  return data.events || [];
}

/**
 * Finds a match's live status within a scoreboard `events` array by team codes.
 * Returns { state: 'pre'|'in'|'post', clock, period, homeScore, awayScore,
 * winner, statusDetail, shootoutNote } or null if the match isn't found.
 *
 * `winner` ('home'|'away'|null) and `shootoutNote` matter for knockout matches
 * decided on penalties — the scoreline alone stays level (e.g. 1-1), so the
 * scoreboard's own winner flag and the human-readable note ("Paraguay advance
 * 4-3 on penalties") are the only signals that say who actually advances.
 */
export function matchEspnStatus(events, match) {
  for (const event of events) {
    const comp = event.competitions?.[0];
    if (!comp) continue;

    const home = comp.competitors.find(c => c.homeAway === 'home');
    const away = comp.competitors.find(c => c.homeAway === 'away');
    if (
      normalizeEspnCode(home?.team?.abbreviation) !== match.homeCode
      || normalizeEspnCode(away?.team?.abbreviation) !== match.awayCode
    ) continue;

    const winner = home.winner ? 'home' : away.winner ? 'away' : null;

    return {
      state:         comp.status.type.state, // 'pre' | 'in' | 'post'
      clock:         comp.status.displayClock,
      period:        comp.status.period,
      homeScore:     Number(home.score),
      awayScore:     Number(away.score),
      winner,
      statusDetail:  comp.status.type.shortDetail ?? comp.status.type.detail ?? null, // e.g. "FT-Pens"
      shootoutNote:  comp.notes?.find(n => n.type === 'event')?.text ?? null,
    };
  }

  return null;
}

/**
 * Looks up live status for a single match by date + team codes.
 * Returns { state: 'pre'|'in'|'post', clock, homeScore, awayScore } or null
 * if the match isn't found (or the fetch fails).
 */
export async function fetchEspnMatchStatus(match) {
  const events = await fetchEspnScoreboard(match.date);
  return matchEspnStatus(events, match);
}

/**
 * Finds a match's ESPN event id within a scoreboard `events` array by team
 * codes. Returns a string id, or null if the match isn't found.
 */
export function matchEspnEventId(events, match) {
  for (const event of events) {
    const comp = event.competitions?.[0];
    if (!comp) continue;

    const home = comp.competitors.find(c => c.homeAway === 'home');
    const away = comp.competitors.find(c => c.homeAway === 'away');
    if (
      normalizeEspnCode(home?.team?.abbreviation) !== match.homeCode
      || normalizeEspnCode(away?.team?.abbreviation) !== match.awayCode
    ) continue;

    return event.id || null;
  }

  return null;
}

/**
 * Fetches ESPN's match summary direct from ESPN (live games, fallback).
 */
export async function fetchEspnSummary(eventId) {
  const res = await fetch(`${SUMMARY_BASE}?event=${eventId}`);
  if (!res.ok) throw new Error(`ESPN summary ${res.status}`);
  return res.json();
}

/**
 * Fetches a finished-game summary via the /api/summary cache layer.
 * On cache-miss the Worker proxies ESPN and stores the result in D1,
 * so subsequent calls return instantly from the edge.
 * Falls back to direct ESPN fetch if the cache endpoint is unavailable.
 */
export async function fetchCachedSummary(eventId) {
  try {
    const res = await fetch(`/api/summary?eventId=${eventId}`);
    // Await the parse inside the try — a non-JSON 200 (e.g. no /api/summary
    // route in local dev, which falls through to the SPA's index.html)
    // must also fall back to ESPN, not throw past this function.
    if (res.ok) return await res.json();
  } catch { /* network error or bad JSON — fall through to ESPN */ }
  return fetchEspnSummary(eventId);
}

/**
 * Explicitly stores a finished-game summary in D1 via the /api/summary
 * POST endpoint. Called when a live game transitions to 'post' and summary
 * is already in hand — avoids waiting for the first-read cache-miss path.
 * Fire-and-forget: failures are silent.
 */
export async function storeSummaryCache(eventId, matchId, data) {
  try {
    await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, matchId, data }),
    });
  } catch { /* best effort */ }
}
