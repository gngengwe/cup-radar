// ─── Match Excitement Engine — MVP ─────────────────────────────────────────
// Soccer adaptation of game_right_here's lib/analytics/excitementEngine.ts.
// MVP is score/clock/state-driven only (ESPN scoreboard fields) — no
// commentary/event feed yet. All component functions are pure and return
// 0-1; computeMatchExcitement() combines them via MATCH_EXCITEMENT_WEIGHTS
// and a power curve into a 0-100 score with a label.

import {
  MATCH_EXCITEMENT_WEIGHTS,
  EXCITEMENT_CURVE_EXPONENT,
  EXCITEMENT_LABELS,
  UPSET_RANK_GAP_THRESHOLD,
} from '../config/matchExcitementWeights';
import teamStrength from '../data/team-strength.json';

const KNOCKOUT_STAGES = new Set([
  'Round of 32',
  'Round of 16',
  'Quarterfinal',
  'Semifinal',
  '3rd Place Match',
  'Final',
]);

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

/**
 * Parses ESPN's displayClock string ("45'+2'", "23'", "HT", "FT") into
 * { minute, stoppage }. Returns nulls if the clock can't be parsed
 * (e.g. "HT"/"FT"/pre-match).
 */
export function parseClock(clockStr) {
  if (!clockStr) return { minute: null, stoppage: 0 };
  const match = String(clockStr).match(/^(\d+)(?:\+(\d+))?'?/);
  if (!match) return { minute: null, stoppage: 0 };
  return { minute: Number(match[1]), stoppage: Number(match[2] || 0) };
}

/**
 * Derives a coarse match phase from ESPN's period + displayClock + state.
 * Returns one of: 'pre' | 'first-half' | 'halftime' | 'second-half' |
 * 'extra-time' | 'penalties' | 'finished'.
 */
export function getMatchPhase(espn) {
  if (!espn) return 'pre';
  if (espn.state === 'post') return 'finished';
  if (espn.state === 'pre') return 'pre';

  const clock = String(espn.clock || '').toUpperCase();
  if (clock === 'HT') return 'halftime';
  if (clock === 'FT') return 'finished';

  const period = espn.period || 1;
  if (period >= 5) return 'penalties';
  if (period >= 3) return 'extra-time';
  if (period === 2) return 'second-half';
  return 'first-half';
}

/**
 * Score Pressure — closer scorelines are more tense. Tied = max pressure.
 */
export function computeScorePressure(homeScore, awayScore) {
  const diff = Math.abs(homeScore - awayScore);
  if (diff === 0) return 1.0;
  if (diff === 1) return 0.65;
  if (diff === 2) return 0.3;
  return 0.1;
}

/**
 * Clock Leverage — how much "time pressure" the current moment carries.
 * Builds toward halftime, then ramps hard through the second-half run-in
 * and stoppage time; extra time and penalties are maximal.
 */
export function computeClockLeverage(phase, minute, stoppage) {
  switch (phase) {
    case 'pre':
    case 'halftime':
    case 'finished':
      return 0.0;
    case 'first-half': {
      const m = minute ?? 0;
      if (m >= 40) return 0.55;
      if (m >= 25) return 0.4;
      return 0.25;
    }
    case 'second-half': {
      const m = minute ?? 45;
      if (stoppage > 0) return 1.0;
      if (m >= 85) return 0.95;
      if (m >= 75) return 0.8;
      if (m >= 60) return 0.6;
      return 0.45;
    }
    case 'extra-time':
      return stoppage > 0 ? 1.0 : 0.9;
    case 'penalties':
      return 1.0;
    default:
      return 0.3;
  }
}

/**
 * Stage & Scenario — knockout matches (and decisive final group matchday
 * games) carry inherently higher stakes than an early group game.
 */
export function computeStageAndScenario(match) {
  if (!match) return 0.3;
  if (KNOCKOUT_STAGES.has(match.stage)) {
    if (match.stage === 'Final') return 1.0;
    if (match.stage === 'Semifinal') return 0.85;
    if (match.stage === '3rd Place Match') return 0.7;
    if (match.stage === 'Quarterfinal') return 0.75;
    if (match.stage === 'Round of 16') return 0.65;
    return 0.55; // Round of 32
  }
  // Group stage — final matchday games (decisive for qualification) run hotter
  if (match.matchday === 3) return 0.5;
  return 0.3;
}

/**
 * Upset Pressure — is the lower-ranked (FIFA) team currently level or ahead?
 * Returns 0 if rankings are missing, the gap is below threshold, or the
 * underdog is currently losing.
 */
export function computeUpsetPressure(match, homeScore, awayScore) {
  if (!match) return 0;
  const home = teamStrength[match.homeCode];
  const away = teamStrength[match.awayCode];
  if (!home || !away) return 0;

  const rankGap = Math.abs(home.fifaRanking - away.fifaRanking);
  if (rankGap < UPSET_RANK_GAP_THRESHOLD) return 0;

  const homeIsUnderdog = home.fifaRanking > away.fifaRanking;
  const diff = homeScore - awayScore;
  const underdogLevelOrAhead = homeIsUnderdog ? diff >= 0 : diff <= 0;
  if (!underdogLevelOrAhead) return 0;

  return clamp01(rankGap / 60);
}

/**
 * Lead Swing Drama — how often has the lead/tie state flipped recently?
 * `history` is an array of { homeScore, awayScore } snapshots, oldest first.
 */
export function computeLeadSwingDrama(history) {
  if (!history || history.length < 2) return 0.1;

  const states = history.map(h => Math.sign(h.homeScore - h.awayScore));
  let swings = 0;
  for (let i = 1; i < states.length; i += 1) {
    if (states[i] !== states[i - 1]) swings += 1;
  }

  if (swings === 0) return 0.1;
  if (swings === 1) return 0.5;
  return 1.0;
}

/**
 * Finish Bonus — late-game or extra-time situations with a close scoreline
 * get an extra nudge, mirroring game_right_here's "clutch finish" signal.
 */
export function computeFinishBonus(phase, minute, stoppage, scoreDiff) {
  if (scoreDiff > 1) return 0;

  if (phase === 'second-half' && (stoppage > 0 || (minute ?? 0) >= 80)) return 1.0;
  if (phase === 'extra-time') return 1.0;
  if (phase === 'penalties') return 1.0;
  return 0;
}

/**
 * Attack Pressure (V2) — shot/corner volume in the last 10 minutes, weighted
 * toward the trailing team's share of it. Requires commentary `events` from
 * normalizeEspnSoccerSummary; returns 0 without them (graceful degradation).
 */
export function computeAttackPressure(events, match, minute, homeScore, awayScore) {
  if (!events?.length || minute == null) return 0;

  const windowStart = minute - 10;
  const recent = events.filter(ev =>
    (ev.family === 'shot' || ev.family === 'corner') &&
    ev.minute != null && ev.minute >= windowStart && ev.minute <= minute
  );
  if (recent.length === 0) return 0;

  let pressure = clamp01(recent.length / 6);

  const diff = homeScore - awayScore;
  const trailingTeam = diff < 0 ? match?.homeTeam : diff > 0 ? match?.awayTeam : null;
  if (trailingTeam) {
    const trailingCount = recent.filter(ev => ev.teamName === trailingTeam).length;
    pressure = clamp01(pressure + (trailingCount / 4) * 0.5);
  }

  return pressure;
}

/**
 * Chaos Bonus (V2) — red cards, penalties and yellow-card pileups spike
 * unpredictability. Requires commentary `events`; returns 0 without them.
 */
export function computeChaosBonus(events) {
  if (!events?.length) return 0;

  if (events.some(ev => ev.family === 'red-card')) return 1.0;
  if (events.some(ev => ev.family === 'penalty')) return 0.6;

  const yellows = events.filter(ev => ev.family === 'yellow-card').length;
  if (yellows >= 3) return 0.4;
  if (yellows >= 1) return 0.15;

  return 0;
}

/**
 * Combines all components into a 0-100 excitement score + label.
 * `history` is an array of { homeScore, awayScore } snapshots for this
 * match, oldest first (see useMatchExcitement). `summary` is the optional
 * result of normalizeEspnSoccerSummary — when its `scoreTimeline` is
 * non-empty it supersedes `history` for lead-swing detection (it covers the
 * whole match, not just snapshots taken while polling).
 */
export function computeMatchExcitement(match, espn, history = [], summary = {}) {
  const homeScore = espn?.homeScore ?? match?.homeScore ?? 0;
  const awayScore = espn?.awayScore ?? match?.awayScore ?? 0;
  const phase = getMatchPhase(espn);
  const { minute, stoppage } = parseClock(espn?.clock);

  const events = summary?.events || [];
  const scoreTimeline = summary?.scoreTimeline || [];
  const leadHistory = scoreTimeline.length > 0
    ? [{ homeScore: 0, awayScore: 0 }, ...scoreTimeline]
    : history;

  const components = {
    scorePressure:    computeScorePressure(homeScore, awayScore),
    clockLeverage:    computeClockLeverage(phase, minute, stoppage),
    stageAndScenario: computeStageAndScenario(match),
    upsetPressure:    computeUpsetPressure(match, homeScore, awayScore),
    attackPressure:   computeAttackPressure(events, match, minute, homeScore, awayScore),
    leadSwingDrama:   computeLeadSwingDrama(leadHistory),
    chaosBonus:       computeChaosBonus(events),
    finishBonus:      computeFinishBonus(phase, minute, stoppage, Math.abs(homeScore - awayScore)),
  };

  let raw = 0;
  for (const [key, weight] of Object.entries(MATCH_EXCITEMENT_WEIGHTS)) {
    raw += weight * (components[key] ?? 0);
  }
  raw = clamp01(raw);

  const score = Math.round(100 * Math.pow(raw, EXCITEMENT_CURVE_EXPONENT));
  const band = EXCITEMENT_LABELS.find(b => score >= b.min) || EXCITEMENT_LABELS[EXCITEMENT_LABELS.length - 1];

  return {
    score,
    raw,
    components,
    label: band.label,
    shortLabel: band.short,
    phase,
    minute,
    stoppage,
    events,
    scoreTimeline,
  };
}
