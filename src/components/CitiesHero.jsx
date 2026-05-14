// The main city selection section on the landing page.
// Replaces the old single-city SeattleHQ preview.

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
    modules: [
      'Matchday logistics',
      'Transit notes',
      'Fan zones & watch parties',
      'Pre-game guide',
      'Ticket watch',
      'Should I go? scores',
      'City Jump from Seattle',
      'Seattle Watch Guide',
    ],
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
    modules: [
      'Matchday logistics',
      'Transit & shuttles',
      'Fan zones & watch parties',
      'BBQ & pre-game guide',
      'Ticket watch',
      'Should I go? scores',
      'City Jump from Kansas City',
      'KC Watch Guide',
    ],
    ctaLabel: 'Open Kansas City HQ →',
    badge:    '⭐ Hosts the Quarterfinal',
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
        <span className="section-label">Two cities. One dashboard.</span>
        <h2 className="section-heading">Choose your HQ city.</h2>
        <p className="section-sub">
          Cup Radar goes deepest in your home city. Every dashboard section —
          City Jump, Watch Guide, Ticket Radar, match logistics — is built around
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
