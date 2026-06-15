// ─── Match Excitement — weights & thresholds ──────────────────────────────
// Adapted from game_right_here's DEFAULT_EXCITEMENT_WEIGHTS / GAME_RIGHT_HERE
// pattern. `attackPressure` and `chaosBonus` are V2 components driven by
// ESPN's commentary feed (see normalizeEspnSoccerSummary.js) — they default
// to 0 when no summary data is available, so matches without commentary
// simply can't reach the top of the 1.00 raw-score range (graceful
// degradation, matching MATCH_EXCITEMENT_ADAPTATION_PLAN.md).

// Component weights — sum to 1.00
export const MATCH_EXCITEMENT_WEIGHTS = {
  scorePressure:    0.26,
  clockLeverage:    0.20,
  stageAndScenario: 0.12,
  upsetPressure:    0.10,
  attackPressure:   0.12, // V2 — requires commentary-derived shot/corner events
  leadSwingDrama:   0.09,
  chaosBonus:       0.06, // V2 — requires commentary-derived card/penalty events
  finishBonus:      0.05,
};

// Power curve applied to the weighted raw score (0-1) before scaling to 0-100.
// >1 makes the curve "sticky" in the middle — only matches where several
// signals stack at once climb into the 85+ "Goal Right Here" band.
export const EXCITEMENT_CURVE_EXPONENT = 1.3;

// Score bands for the meter label
export const EXCITEMENT_LABELS = [
  { min: 85, label: 'Goal Right Here', short: 'GOAL RIGHT HERE' },
  { min: 75, label: 'High Alert',      short: 'High Alert' },
  { min: 60, label: 'Tense',           short: 'Tense' },
  { min: 40, label: 'Live',            short: 'Live' },
  { min: 0,  label: 'Calm',            short: 'Calm' },
];

// A FIFA ranking gap at/above this between the two teams flags an "underdog"
export const UPSET_RANK_GAP_THRESHOLD = 15;

// Score (0-100) at/above which "Goal Right Here" badge becomes eligible
export const GOAL_RIGHT_HERE_THRESHOLD = 85;

// Consecutive polls (≈30s cadence) the score must stay at/above the
// threshold before the "Goal Right Here" badge fires — avoids one-tick flicker
export const GOAL_RIGHT_HERE_SUSTAIN_TICKS = 2;

// How many score-change snapshots to keep per match for lead-swing detection
export const EXCITEMENT_HISTORY_CAP = 30;
