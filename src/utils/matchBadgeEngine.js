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
} from '../config/matchExcitementWeights';

const ELIMINATION_STAGES = new Set([
  'Round of 32',
  'Round of 16',
  'Quarterfinal',
  'Semifinal',
  'Final',
]);

function byId(id) {
  return MATCH_BADGE_DEFINITIONS.find(b => b.id === id);
}

/**
 * Returns the set of badge ids currently active for this match.
 */
function activeBadgeIds(match, espn, excitement, sustainTicks) {
  const ids = [];
  if (!match || !espn || !excitement) return ids;

  const homeScore = espn.homeScore ?? 0;
  const awayScore = espn.awayScore ?? 0;
  const { phase, minute, stoppage, components, score } = excitement;

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

  // Upset Alert — underdog currently level or ahead
  if (components.upsetPressure > 0) {
    ids.push('upset-alert');
  }

  // Win or Go Home — knockout stage where the loser is eliminated
  if (ELIMINATION_STAGES.has(match.stage)) {
    ids.push('win-or-go-home');
  }

  // Extra Time — match has gone beyond regulation
  if (phase === 'extra-time' || phase === 'penalties') {
    ids.push('extra-time-drama');
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
