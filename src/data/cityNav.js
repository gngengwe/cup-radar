// Shared city metadata + nav structure for the left sidebar — used by both
// the city Dashboard (always-visible column there) and the global nav
// drawer (Navbar, off-canvas everywhere else).
export const CITY_META = {
  seattle:    { label: 'Seattle HQ',      short: 'Seattle',      icon: '🏟️', matchCount: 6, accentVar: 'var(--accent)' },
  kansascity: { label: 'Kansas City HQ',  short: 'Kansas City',  icon: '🏈', matchCount: 6, accentVar: '#c084fc' },
  miami:      { label: 'Miami HQ',        short: 'Miami',        icon: '🌴', matchCount: 7, accentVar: '#f43f5e' },
  newyork:    { label: 'New York HQ',     short: 'New York',     icon: '🗽', matchCount: 9, accentVar: '#3b82f6' },
  philly:     { label: 'Philadelphia HQ', short: 'Philly',       icon: '🦅', matchCount: 6, accentVar: '#10b981' },
  atlanta:    { label: 'Atlanta HQ',      short: 'Atlanta',      icon: '🍑', matchCount: 8, accentVar: '#fb923c' },
  vancouver:  { label: 'Vancouver HQ',    short: 'Vancouver',    icon: '🍁', matchCount: 7, accentVar: '#22d3ee' },
  losangeles: { label: 'Los Angeles HQ',  short: 'Los Angeles',  icon: '🎬', matchCount: 8, accentVar: '#facc15' },
};

// Nav ordered by day-to-day relevance — HQ + Team IQ front, then action, then intel
export function buildNav(city) {
  const cfg = CITY_META[city];
  return [
    { id: 'hq',         label: cfg.label,           icon: cfg.icon,  desc: `${cfg.matchCount} matches` },
    { id: 'primer',     label: 'New to Soccer?',    icon: '🎓',      desc: 'World Cup guide', external: true, to: '/world-cup-primer' },
    { id: '__divider-1__', divider: true },
    { id: 'allgames',   label: 'All Games',         icon: '📅',       desc: 'Search every match'   },
    { id: 'allteams',   label: 'All 48 Teams',      icon: '🌍',       desc: 'Squads & status'      },
    { id: 'teamiq',     label: 'Country · Team IQ', icon: '🧠',      desc: 'Know every team'      },
    { id: 'matches',    label: 'Match Tracker',      icon: '⚽',      desc: 'City view'            },
    { id: 'watch',      label: 'Watch Guide',        icon: '🍺',      desc: 'Bars & neighborhoods' },
    { id: 'tickets',    label: 'Ticket Pulse',       icon: '🎫',      desc: 'Market read'          },
    { id: '__divider-2__', divider: true },
    { id: 'groups',     label: 'Group Tracker',      icon: '📊',      desc: '12 groups'            },
    { id: 'bracket',    label: 'Bracket',            icon: '🏆',      desc: 'Knockout rounds'      },
    { id: 'upsets',     label: 'Upset Radar',        icon: '🚨',      desc: 'Chaos potential'      },
    { id: 'narratives', label: 'Narratives',         icon: '📖',      desc: 'Tournament stories'   },
    { id: 'news',       label: 'Newsroom',           icon: '📰',      desc: 'Latest stories'       },
    { id: '__divider-3__', divider: true },
    { id: 'live-pulse',  label: 'Live Pulse',        icon: '📡',      desc: 'Match cards, live',     external: true, to: '/live-pulse'  },
    { id: 'goal-radar',  label: 'Goal Radar',        icon: '🎯',      desc: 'Every goal, every match', external: true, to: '/goal-radar' },
    { id: 'stats',       label: 'By the Numbers',    icon: '📈',      desc: 'Stats & deep dives',    external: true, to: '/stats'       },
  ];
}
