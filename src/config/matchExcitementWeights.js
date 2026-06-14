// ─── Match Excitement — MVP weights & thresholds ──────────────────────────
// Adapted from game_right_here's DEFAULT_EXCITEMENT_WEIGHTS / GAME_RIGHT_HERE
// pattern. MVP uses only score/clock/state-driven signals (no commentary
// feed yet) — attackPressure & chaosBonus are V2 additions once the ESPN
// summary/commentary endpoint is wired in.

// Component weights — sum to 1.00
export const MATCH_EXCITEMENT_WEIGHTS = {
  scorePressure:    0.32,
  clockLeverage:    0.24,
  stageAndScenario: 0.15,
  upsetPressure:    0.12,
  leadSwingDrama:   0.11,
  finishBonus:      0.06,
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
