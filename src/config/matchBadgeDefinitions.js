// ─── Match Badges — MVP definitions ────────────────────────────────────────
// Adapted from game_right_here's config/badgeDefinitions.ts. Priority numbers
// are preserved from the full 12-badge plan in MATCH_EXCITEMENT_ADAPTATION_PLAN.md
// so the V2 (event-driven) badges can be slotted in later without renumbering.

export const MATCH_BADGE_DEFINITIONS = [
  {
    id: 'goal-right-here',
    name: 'Goal Right Here',
    category: 'excitement',
    priority: 1,
    icon: '🔥',
    color: '#ff4d4f',
    shortDescription: 'Peak moment — anything can happen',
    explanation: 'Excitement score has stayed at 85+ for multiple updates — score, clock and stakes are all stacked at once.',
  },
  {
    id: 'late-equalizer-watch',
    name: 'Late Equalizer Watch',
    category: 'drama',
    priority: 2,
    icon: '⏳',
    color: '#faad14',
    shortDescription: 'Trailing team is chasing a late leveler',
    explanation: 'A team is down by exactly one goal in the final 20 minutes (or stoppage time) — every chance now matters.',
  },
  {
    id: 'upset-alert',
    name: 'Upset Alert',
    category: 'storyline',
    priority: 5,
    icon: '⚡',
    color: '#9254de',
    shortDescription: 'The underdog is leading or level',
    explanation: 'The lower-ranked team (by ≥15 FIFA places) is currently level or ahead.',
  },
  {
    id: 'win-or-go-home',
    name: 'Win or Go Home',
    category: 'stakes',
    priority: 10,
    icon: '🎯',
    color: '#13c2c2',
    shortDescription: 'Knockout stage — loser is eliminated',
    explanation: 'This is a knockout-stage match (Round of 32 or later), so the result ends one team’s tournament.',
  },
  {
    id: 'extra-time-drama',
    name: 'Extra Time',
    category: 'drama',
    priority: 11,
    icon: '🥵',
    color: '#ff7a45',
    shortDescription: 'The match has gone to extra time',
    explanation: 'Regulation ended level in a knockout match — 30 more minutes (and maybe penalties) await.',
  },
];

export const MATCH_BADGE_MAX_SECONDARY = 2;
