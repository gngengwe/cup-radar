// ─── normalizeEspnSoccerSummary — V2 event log from ESPN's summary endpoint ──
// Handles two ESPN response shapes:
//   Shape A: { commentary: [{ play: {...} }] }  — older/post-match format
//   Shape B: { plays: [{...}] }                 — live/current format
// Also extracts aggregate boxscore stats (shots, corners, cards) as a
// reliable V2 fallback when per-minute commentary is sparse or absent.
//
// Best-effort only: if source data is missing/malformed, returns empty
// arrays/null rather than throwing — callers fall back to MVP signals.

const GOAL_LINE = /^Goal!\s*(.+?)\s+(\d+),\s*(.+?)\s+(\d+)/i;

function classifyFamily(rawType, typeText) {
  const t = (rawType || typeText || '').toLowerCase().replace(/[\s_]/g, '-');
  if (t.includes('penalty'))                          return 'penalty';
  if (t.includes('own') && t.includes('goal'))        return 'goal';
  if (t === 'goal' || t.startsWith('goal-'))          return 'goal';
  if (t.includes('second-yellow') || t.includes('red-card')) return 'red-card';
  if (t.includes('yellow-card'))                      return 'yellow-card';
  if (t.includes('substitution') || t === 'sub')      return 'substitution';
  if (t.includes('shot'))                             return 'shot';
  if (t.includes('corner'))                           return 'corner';
  if (t.includes('offside'))                          return 'offside';
  if (t.includes('foul'))                             return 'foul';
  if (t.includes('delay'))                            return 'delay';
  if (t.includes('half') || t.includes('period') || t.includes('match')) return 'phase';
  return 'other';
}

function parseMinute(clock) {
  const display = clock?.displayValue;
  if (!display) return null;
  const m = String(display).match(/^(\d+)/);
  return m ? Number(m[1]) : null;
}

// Normalise a raw play object (either from commentary.play or plays[i])
function normPlay(raw) {
  if (!raw?.id) return null;
  const rawType  = raw.type?.type  || raw.type?.abbreviation || '';
  const typeText = raw.type?.text  || raw.type?.name         || '';
  return {
    id:          raw.id,
    minute:      parseMinute(raw.clock),
    minuteLabel: raw.clock?.displayValue || '',
    period:      raw.period?.number ?? null,
    teamName:    raw.team?.displayName || raw.team?.name || null,
    text:        raw.text || '',
    rawType,
    family:      classifyFamily(rawType, typeText),
  };
}

// Try commentary (Shape A, items wrapped in .play), then plays (Shape B, direct)
function extractEvents(summary) {
  const sources = [
    // Shape A
    Array.isArray(summary?.commentary)
      ? summary.commentary.map(i => normPlay(i?.play)).filter(Boolean)
      : null,
    // Shape B
    Array.isArray(summary?.plays)
      ? summary.plays.map(i => normPlay(i?.play ?? i)).filter(Boolean)
      : null,
    // Shape C: some endpoints nest under playByPlay
    Array.isArray(summary?.playByPlay)
      ? summary.playByPlay.map(i => normPlay(i?.play ?? i)).filter(Boolean)
      : null,
  ].filter(a => a?.length > 0);

  return sources[0] || [];
}

// Extract aggregate boxscore stats per team (reliable even for sparse commentary)
function extractBoxscoreStats(summary) {
  const teams = summary?.boxscore?.teams;
  if (!Array.isArray(teams) || teams.length < 2) return null;

  const getTeam = (side) =>
    teams.find(t => (t.team?.homeAway || t.homeAway) === side) || teams.find(t => t.homeAway === side);

  const home = getTeam('home');
  const away = getTeam('away');
  if (!home || !away) return null;

  const stat = (team, ...names) => {
    for (const name of names) {
      const s = team.statistics?.find(s => s.name === name);
      if (s) return Number(s.displayValue) || 0;
    }
    return 0;
  };

  return {
    homeShots:        stat(home, 'shotsTotal', 'totalShots', 'shots'),
    awayShots:        stat(away, 'shotsTotal', 'totalShots', 'shots'),
    homeShotsOnTarget: stat(home, 'shotsOnTarget', 'shotsOnGoal'),
    awayShotsOnTarget: stat(away, 'shotsOnTarget', 'shotsOnGoal'),
    homeCorners:      stat(home, 'cornersTotal', 'cornerKicks', 'corners'),
    awayCorners:      stat(away, 'cornersTotal', 'cornerKicks', 'corners'),
    homeYellow:       stat(home, 'yellowCardsTotal', 'yellowCards'),
    awayYellow:       stat(away, 'yellowCardsTotal', 'yellowCards'),
    homeRed:          stat(home, 'redCardsTotal', 'redCards'),
    awayRed:          stat(away, 'redCardsTotal', 'redCards'),
    homeFouls:        stat(home, 'foulsTotal', 'fouls'),
    awayFouls:        stat(away, 'foulsTotal', 'fouls'),
    homePossession:   stat(home, 'possessionPct', 'possession'),
    awayPossession:   stat(away, 'possessionPct', 'possession'),
  };
}

/**
 * Normalizes an ESPN summary response into:
 *  - events: deduped, classified SoccerMatchEvent[] sorted oldest-first
 *  - scoreTimeline: { minute, homeScore, awayScore }[] from goal commentary
 *  - stats: aggregate boxscore stats (shots/corners/cards) or null
 */
export function normalizeEspnSoccerSummary(summary, match) {
  const events = extractEvents(summary);

  // Dedupe by id (ESPN sometimes repeats plays across related events)
  const seen = new Set();
  const deduped = events.filter(ev => {
    if (seen.has(ev.id)) return false;
    seen.add(ev.id);
    return true;
  });
  deduped.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));

  const scoreTimeline = [];
  for (const ev of deduped) {
    const goalLine = ev.text.match(GOAL_LINE);
    if (!goalLine) continue;

    const [, teamA, scoreA, teamB, scoreB] = goalLine;
    let homeScore, awayScore;
    if (teamA.trim() === match?.homeTeam) {
      homeScore = Number(scoreA); awayScore = Number(scoreB);
    } else if (teamA.trim() === match?.awayTeam) {
      awayScore = Number(scoreA); homeScore = Number(scoreB);
    } else {
      continue;
    }
    scoreTimeline.push({ minute: ev.minute, homeScore, awayScore });
  }

  return {
    events:        deduped,
    scoreTimeline,
    stats:         extractBoxscoreStats(summary),
  };
}
