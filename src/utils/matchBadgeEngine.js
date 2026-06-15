// ─── Match Badge Engine — MVP ──────────────────────────────────────────────
// Soccer adaptation of game_right_here's lib/analytics/badgeEngine.ts.
// Evaluates the MVP badge set (score/clock/state-driven) against a match's
// current excitement result and returns one dominant badge plus up to
// MATCH_BADGE_MAX_SECONDARY secondary badges, ranked by priority (lower = more important).

import {
  MATCH_BADGE_DEFINITIONS,
  MATCH_BADGE_MAX_SECONDARY,
} from '../config/matchBadgeDefinitions';
import {
  GOAL_RIGHT_HERE_THRESHOLD,
  GOAL_RIGHT_HERE_SUSTAIN_TICKS,
  UPSET_RANK_GAP_THRESHOLD,
} from '../config/matchExcitementWeights';
import teamStrength from '../data/team-strength.json';

const ELIMINATION_STAGES = new Set([
  'Round of 32',
  'Round of 16',
  'Quarterfinal',
  'Semifinal',
  'Final',
]);

const SIEGE_MODE_THRESHOLD = 0.6;
const STOPPAGE_GOAL_MINUTE = 90;
const COMEBACK_DEFICIT = 2;

function byId(id) {
  return MATCH_BADGE_DEFINITIONS.find(b => b.id === id);
}

/**
 * Returns true if the home side is the underdog (≥UPSET_RANK_GAP_THRESHOLD
 * FIFA places below the away side), false if the away side is, or null if
 * rankings are missing or the gap is below threshold.
 */
function isHomeUnderdog(match) {
  const home = teamStrength[match.homeCode];
  const away = teamStrength[match.awayCode];
  if (!home || !away) return null;

  const rankGap = Math.abs(home.fifaRanking - away.fifaRanking);
  if (rankGap < UPSET_RANK_GAP_THRESHOLD) return null;

  return home.fifaRanking > away.fifaRanking;
}

/**
 * Detects whether either side overturned a 2+ goal deficit to draw level or
 * win, using the commentary-derived scoreTimeline (oldest-first, no leading
 * 0-0 entry).
 */
function hasComeback(scoreTimeline) {
  if (!scoreTimeline?.length) return false;

  const timeline = [{ homeScore: 0, awayScore: 0 }, ...scoreTimeline];
  let maxHomeDeficit = 0;
  let maxAwayDeficit = 0;
  for (const snap of timeline) {
    const diff = snap.homeScore - snap.awayScore;
    if (-diff > maxHomeDeficit) maxHomeDeficit = -diff;
    if (diff > maxAwayDeficit) maxAwayDeficit = diff;
  }

  const final = timeline[timeline.length - 1];
  const finalDiff = final.homeScore - final.awayScore;
  if (maxHomeDeficit >= COMEBACK_DEFICIT && finalDiff >= 0) return true;
  if (maxAwayDeficit >= COMEBACK_DEFICIT && finalDiff <= 0) return true;
  return false;
}

/**
 * Returns the set of badge ids active for this match. For finished matches
 * (phase === 'finished'), only result-based badges apply — "Goal Right Here"
 * and "Late Equalizer Watch" are in-the-moment signals with no meaning after
 * full time.
 */
function activeBadgeIds(match, espn, excitement, sustainTicks) {
  const ids = [];
  if (!match || !espn || !excitement) return ids;

  const homeScore = espn.homeScore ?? 0;
  const awayScore = espn.awayScore ?? 0;
  const { phase, minute, stoppage, components, score, events, scoreTimeline } = excitement;
  const isFinal = phase === 'finished';

  if (!isFinal) {
    // Goal Right Here — score sustained at/above threshold for multiple polls
    if (score >= GOAL_RIGHT_HERE_THRESHOLD && sustainTicks >= GOAL_RIGHT_HERE_SUSTAIN_TICKS) {
      ids.push('goal-right-here');
    }

    // Late Equalizer Watch — trailing by exactly one in the run-in or stoppage time
    const diff = Math.abs(homeScore - awayScore);
    const lateWindow = (phase === 'second-half' && ((minute ?? 0) >= 70 || stoppage > 0))
      || phase === 'extra-time';
    if (diff === 1 && lateWindow) {
      ids.push('late-equalizer-watch');
    }

    // Siege Mode — trailing team piling on shots/corners in a short window
    if (homeScore !== awayScore && components.attackPressure >= SIEGE_MODE_THRESHOLD) {
      ids.push('siege-mode');
    }
  }

  // Stoppage-Time Stunner — a goal landed in the 90th minute or later
  if (events?.some(ev => ev.family === 'goal' && (ev.minute ?? 0) >= STOPPAGE_GOAL_MINUTE)) {
    ids.push('stoppage-time-stunner');
  }

  // Comeback Complete — a 2+ goal deficit was erased to level or win
  if (hasComeback(scoreTimeline)) {
    ids.push('comeback-complete');
  }

  // Red Card Chaos — a red (or second yellow) card was shown
  if (events?.some(ev => ev.family === 'red-card')) {
    ids.push('red-card-chaos');
  }

  // Penalty Drama — a penalty kick was awarded
  if (events?.some(ev => ev.family === 'penalty')) {
    ids.push('penalty-drama');
  }

  // Upset Alert / Giant Killers — underdog is/finished level (alert) or
  // is/finished ahead (giant killers)
  if (components.upsetPressure > 0) {
    const homeUnderdog = isHomeUnderdog(match);
    if (homeUnderdog !== null) {
      const diff = homeScore - awayScore;
      const underdogDiff = homeUnderdog ? diff : -diff;
      ids.push(underdogDiff > 0 ? 'giant-killers' : 'upset-alert');
    }
  }

  // Win or Go Home — knockout stage where the loser is eliminated
  if (ELIMINATION_STAGES.has(match.stage)) {
    ids.push('win-or-go-home');
  }

  // Shootout Thriller — match was/is decided on penalties
  if (phase === 'penalties' || (isFinal && (espn.period ?? 0) >= 5)) {
    ids.push('shootout-thriller');
  } else if (phase === 'extra-time' || (isFinal && (espn.period ?? 0) >= 3)) {
    // Extra Time — match went beyond regulation (but didn't reach penalties)
    ids.push('extra-time-drama');
  }

  if (isFinal) {
    const total = homeScore + awayScore;
    const diff = Math.abs(homeScore - awayScore);

    // Goal Fest — 5+ goals across the match
    if (total >= 5) ids.push('goal-fest');

    // Demolition — won by 3+ goals
    if (diff >= 3) ids.push('demolition');

    // Statement Win — won by exactly two goals
    if (diff === 2) ids.push('statement-win');

    // Tight Finish — settled by a single goal
    if (diff === 1) ids.push('tight-finish');

    if (homeScore === 0 && awayScore === 0) {
      // Stalemate — goalless draw
      ids.push('stalemate');
    } else if (diff === 0) {
      // Share the Spoils — both teams scored and drew
      ids.push('share-the-spoils');
    }
  }

  return ids;
}

/**
 * Evaluates badges for a live match. Returns { dominant, secondary } where
 * `dominant` is the single highest-priority active badge (or null) and
 * `secondary` is up to MATCH_BADGE_MAX_SECONDARY additional active badges.
 */
export function evaluateMatchBadges(match, espn, excitement, sustainTicks = 0) {
  const ids = activeBadgeIds(match, espn, excitement, sustainTicks);
  const badges = ids
    .map(byId)
    .filter(Boolean)
    .sort((a, b) => a.priority - b.priority);

  return {
    dominant: badges[0] || null,
    secondary: badges.slice(1, 1 + MATCH_BADGE_MAX_SECONDARY),
  };
}
