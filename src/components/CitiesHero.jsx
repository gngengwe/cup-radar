// The main city selection section on the landing page.

const CITIES = [
  {
    id:         'seattle',
    name:       'Seattle',
    emoji:      '🏟️',
    venue:      'Lumen Field',
    route:      '/seattle/hq',
    accent:     'var(--accent)',
    accentSoft: 'var(--accent-soft)',
    border:     'var(--border-accent)',
    matchCount: 6,
    stages:     'Group Stage · Round of 32 · Round of 16',
    headline:   'The home city experience.',
    keyMatches: [
      { teams: '🇧🇪 Belgium vs Egypt 🇪🇬',         date: 'Jun 15', note: 'Group G' },
      { teams: '🇺🇸 USA vs Australia 🇦🇺',           date: 'Jun 19', note: 'Group D' },
      { teams: '🇧🇦 Bosnia-Herzegovina vs Qatar 🇶🇦', date: 'Jun 24', note: 'Group B' },
      { teams: '🇪🇬 Egypt vs Iran 🇮🇷',              date: 'Jun 26', note: 'Group G · 8pm PT' },
    ],
    modules: ['Matchday logistics', 'Transit notes', 'Fan zones', 'Pre-game guide', 'Should I go? scores', 'Watch Guide'],
    ctaLabel: 'Open Seattle HQ →',
  },
  {
    id:         'kansascity',
    name:       'Kansas City',
    emoji:      '🏈',
    venue:      'Kansas City Stadium',
    route:      '/kansascity/hq',
    accent:     '#c084fc',
    accentSoft: 'rgba(192,132,252,0.1)',
    border:     'rgba(192,132,252,0.25)',
    matchCount: 6,
    stages:     'Group Stage · Round of 32 · Quarterfinal',
    headline:   'Argentina. The Quarterfinal. Arrowhead.',
    keyMatches: [
      { teams: '🇦🇷 Argentina vs Algeria 🇩🇿',  date: 'Jun 16', note: 'Group J' },
      { teams: '🇪🇨 Ecuador vs Curaçao 🇨🇼',    date: 'Jun 20', note: 'Group E' },
      { teams: '🇹🇳 Tunisia vs Netherlands 🇳🇱', date: 'Jun 25', note: 'Group F' },
      { teams: '🇩🇿 Algeria vs Austria 🇦🇹',     date: 'Jun 27', note: 'Group J · 9pm CT' },
    ],
    modules: ['Matchday logistics', 'Transit & shuttles', 'Fan zones', 'BBQ & pre-game guide', 'Should I go? scores', 'KC Watch Guide'],
    ctaLabel: 'Open Kansas City HQ →',
    badge:    '⭐ Hosts the Quarterfinal',
  },
  {
    id:         'miami',
    name:       'Miami',
    emoji:      '🌴',
    venue:      'Hard Rock Stadium',
    route:      '/miami/hq',
    accent:     '#f43f5e',
    accentSoft: 'rgba(244,63,94,0.1)',
    border:     'rgba(244,63,94,0.25)',
    matchCount: 4,
    stages:     'Group Stage · Round of 32',
    headline:   'France. Brazil fans in Wynwood. Hard Rock.',
    keyMatches: [
      { teams: '🇲🇦 Morocco vs Haiti 🇭🇹',  date: 'Jun 19', note: 'Group C' },
      { teams: '🇸🇪 Sweden vs Tunisia 🇹🇳', date: 'Jun 21', note: 'Group F' },
      { teams: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland vs Morocco 🇲🇦', date: 'Jun 24', note: 'Group C' },
      { teams: '🇫🇷 France · Knockout',      date: 'Jun 15', note: 'Round of 32' },
    ],
    modules: ['Matchday logistics', 'Rideshare guide', 'Bayfront fan festival', 'Wynwood pre-game', 'Should I go? scores', 'Miami Watch Guide'],
    ctaLabel: 'Open Miami HQ →',
  },
  {
    id:         'newyork',
    name:       'New York',
    emoji:      '🗽',
    venue:      'MetLife Stadium',
    route:      '/newyork/hq',
    accent:     '#3b82f6',
    accentSoft: 'rgba(59,130,246,0.1)',
    border:     'rgba(59,130,246,0.25)',
    matchCount: 8,
    stages:     'Group Stage · Two Knockout Rounds',
    headline:   'Brazil × Scotland × MetLife. 82,500 seats.',
    keyMatches: [
      { teams: '🇧🇷 Brazil vs Morocco 🇲🇦',  date: 'Jun 14', note: 'Group C' },
      { teams: '🇯🇵 Japan vs Tunisia 🇹🇳',   date: 'Jun 16', note: 'Group F' },
      { teams: '🇧🇷 Brazil vs Scotland 🏴󠁧󠁢󠁳󠁣󠁴󠁿', date: 'Jun 19', note: 'Group C' },
      { teams: '🇧🇷 Brazil · Knockout',       date: 'Jun 14', note: 'Round of 32' },
    ],
    modules: ['Matchday logistics', 'NJ Transit guide', 'Flushing Meadows fan fest', 'Hell\'s Kitchen & Hoboken', 'Should I go? scores', 'NYC Watch Guide'],
    ctaLabel: 'Open New York HQ →',
    badge:    '🌍 Most matches of any city (8)',
  },
  {
    id:         'philly',
    name:       'Philadelphia',
    emoji:      '🦅',
    venue:      'Lincoln Financial Field',
    route:      '/philly/hq',
    accent:     '#10b981',
    accentSoft: 'rgba(16,185,129,0.1)',
    border:     'rgba(16,185,129,0.25)',
    matchCount: 3,
    stages:     'Group Stage',
    headline:   'Oranje. The Linc. South Philly energy.',
    keyMatches: [
      { teams: '🇳🇱 Netherlands vs Sweden 🇸🇪',           date: 'Jun 16', note: 'Group F' },
      { teams: '🇨🇭 Switzerland vs Bosnia-Herzegovina 🇧🇦', date: 'Jun 18', note: 'Group B' },
      { teams: '🇳🇱 Netherlands vs Tunisia 🇹🇳',           date: 'Jun 28', note: 'Group F finale' },
    ],
    modules: ['Matchday logistics', 'Broad Street Line guide', 'Rocky Steps fan festival', 'Xfinity Live & South Philly', 'Should I go? scores', 'Philly Watch Guide'],
    ctaLabel: 'Open Philadelphia HQ →',
  },
];

function MatchRow({ match }) {
  return (
    <div className="cities-hero__match">
      <span className="cities-hero__match-date">{match.date}</span>
      <span className="cities-hero__match-teams">{match.teams}</span>
      <span className="cities-hero__match-note">{match.note}</span>
    </div>
  );
}

function CityCard({ city }) {
  return (
    <div
      className="cities-hero__card"
      style={{ '--city-accent': city.accent, '--city-border': city.border, '--city-soft': city.accentSoft }}
    >
      <div className="cities-hero__card-top">
        <span className="cities-hero__emoji">{city.emoji}</span>
        <div>
          <div className="cities-hero__city-name">{city.name}</div>
          <div className="cities-hero__venue">{city.venue}</div>
        </div>
        {city.badge && (
          <span className="cities-hero__badge">{city.badge}</span>
        )}
      </div>

      <p className="cities-hero__headline">{city.headline}</p>

      <div className="cities-hero__tagline">
        {city.matchCount} matches · {city.stages}
      </div>

      <div className="cities-hero__matches">
        <div className="cities-hero__matches-label">Group stage matches</div>
        {city.keyMatches.map((m, i) => <MatchRow key={i} match={m} />)}
      </div>

      <div className="cities-hero__modules">
        {city.modules.map((m, i) => (
          <span key={i} className="cities-hero__module-chip">{m}</span>
        ))}
      </div>

      <a href={city.route} className="cities-hero__cta">
        {city.ctaLabel}
      </a>
    </div>
  );
}

export default function CitiesHero() {
  return (
    <section className="section cities-hero-section" id="choose-city">
      <div className="container">
        <span className="section-label">Five cities. One dashboard.</span>
        <h2 className="section-heading">Choose your HQ city.</h2>
        <p className="section-sub">
          Cup Radar goes deepest in your home city. Every dashboard section —
          Watch Guide, Ticket Radar, transit pain scores, match logistics — is built around
          where you are.
        </p>

        <div className="cities-hero__grid">
          {CITIES.map(c => <CityCard key={c.id} city={c} />)}
        </div>

        <p className="cities-hero__note">
          Switch cities any time from the dashboard sidebar.
        </p>
      </div>
    </section>
  );
}
