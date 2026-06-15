// ─── normalizeEspnSoccerSummary — V2 event log from ESPN's summary endpoint ──
// Reads `summary.commentary`, dedupes by `play.id` (ESPN reuses ids across
// related plays), and classifies each play into a soccer-wide "event family"
// so badge logic never depends on ESPN's raw (unstable) subtype strings.
// Also derives a `scoreTimeline` from "Goal! TeamA X, TeamB Y." commentary
// text — this is the simplest reliable way to reconstruct the running score
// without guessing which side an own-goal credits.
//
// Best-effort only: if `summary.commentary` is missing/malformed, returns
// empty arrays rather than throwing — callers should treat this as "no V2
// data available" and fall back to MVP (score/clock-only) signals.

const GOAL_LINE = /^Goal!\s*(.+?)\s+(\d+),\s*(.+?)\s+(\d+)/i;

function classifyFamily(rawType) {
  const t = (rawType || '').toLowerCase();
  if (t.includes('penalty')) return 'penalty';
  if (t.includes('own-goal') || t === 'goal' || t.startsWith('goal-')) return 'goal';
  if (t.includes('second-yellow') || t.includes('red-card')) return 'red-card';
  if (t.includes('yellow-card')) return 'yellow-card';
  if (t.includes('substitution')) return 'substitution';
  if (t.includes('shot')) return 'shot';
  if (t.includes('corner')) return 'corner';
  if (t.includes('offside')) return 'offside';
  if (t.includes('delay')) return 'delay';
  if (t.includes('half') || t.includes('period') || t.includes('match')) return 'phase';
  return 'other';
}

function parseMinute(clock) {
  const display = clock?.displayValue;
  if (!display) return null;
  const m = String(display).match(/^(\d+)/);
  return m ? Number(m[1]) : null;
}

/**
 * Normalizes an ESPN summary response into:
 *  - events: deduped, classified SoccerMatchEvent[] sorted oldest-first
 *  - scoreTimeline: { minute, homeScore, awayScore }[] derived from goal text
 */
export function normalizeEspnSoccerSummary(summary, match) {
  const plays = Array.isArray(summary?.commentary) ? summary.commentary : [];
  const seen = new Set();
  const events = [];

  for (const item of plays) {
    const play = item?.play;
    if (!play?.id || seen.has(play.id)) continue;
    seen.add(play.id);

    const rawType = play.type?.type || '';
    events.push({
      id: play.id,
      minute: parseMinute(play.clock),
      minuteLabel: play.clock?.displayValue || '',
      period: play.period?.number ?? null,
      teamName: play.team?.displayName || null,
      text: play.text || '',
      rawType,
      family: classifyFamily(rawType),
    });
  }

  events.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));

  const scoreTimeline = [];
  for (const ev of events) {
    const goalLine = ev.text.match(GOAL_LINE);
    if (!goalLine) continue;

    const [, teamA, scoreA, teamB, scoreB] = goalLine;
    let homeScore;
    let awayScore;
    if (teamA.trim() === match?.homeTeam) {
      homeScore = Number(scoreA);
      awayScore = Number(scoreB);
    } else if (teamA.trim() === match?.awayTeam) {
      awayScore = Number(scoreA);
      homeScore = Number(scoreB);
    } else {
      continue; // team name didn't match either side — skip rather than guess
    }

    scoreTimeline.push({ minute: ev.minute, homeScore, awayScore });
  }

  return { events, scoreTimeline };
}
