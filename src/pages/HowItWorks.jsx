import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    icon: '🏟️',
    id: 'hq',
    name: 'City HQ',
    desc: 'The deepest layer of Cup Radar. Everything you need before, during, and after a match in your city — venue logistics, transit notes, fan zones, matchday weather, pre-game spots, and a "Should I Go?" score for every fixture.',
    bullets: [
      'Per-match countdown (TODAY / TOMORROW / in X days)',
      'Transit Pain Index — how hard is Lumen Field / Arrowhead on this specific match day',
      '"Should I Go?" score 0–100 combining match quality, convenience, atmosphere, and stage',
      'Matchday logistics: venue guide, bag policy, entry gates, parking',
      'Fan zones and watch parties — confirmed + TBC',
      'Pre-game neighborhood and food guide',
      'Calendar export — add all 6 matches to Google Calendar or Apple Calendar',
    ],
  },
  {
    icon: '⚽',
    id: 'matches',
    name: 'Match Tracker',
    desc: 'Every match in the tournament. Defaults to your city\'s matches. Search by team name, filter by stage or group.',
    bullets: [
      'Opens on your city\'s matches by default — switch to "All" anytime',
      'Search by team name: type "Belgium" or "Haaland" to find matches instantly',
      'Filter by group, stage, or host city',
      'Live scores when VITE_FOOTBALL_API_KEY is set',
      'Countdown badges on every upcoming match',
    ],
  },
  {
    icon: '📊',
    id: 'groups',
    name: 'Group Tracker',
    desc: '12 groups, 48 teams, live standings. "My City" filter shows only the groups with matches in your city.',
    bullets: [
      '🏟️ My city filter — one tap to see only your city\'s groups',
      'Groups with local matches highlighted with "Hosts matches" badge',
      'Standings update automatically when API key is set',
      'Scenarios tab — "What does Mexico need to advance?"',
      'Mobile-scrollable tables',
    ],
  },
  {
    icon: '🏆',
    id: 'bracket',
    name: 'Knockout Bracket',
    desc: 'The 32-team elimination bracket. Round of 32 through the Final. Teams populate as the group stage concludes.',
    bullets: [
      'Tabs for each round: R32 · R16 · QF · SF · Final',
      'Seattle and KC knockout matches highlighted',
      'Seattle hosts R32 (July 1) and R16 (July 6)',
      'Kansas City hosts R32 (July 3) and Quarterfinal (July 11)',
    ],
  },
  {
    icon: '🎫',
    id: 'tickets',
    name: 'Ticket Radar',
    desc: 'Observed resale market intelligence. Not a ticket seller — a signal layer. Action labels guide decisions: MOVE, WATCH, or WAIT.',
    bullets: [
      'MOVE — good window right now, act before prices climb',
      'WATCH — monitor but don\'t chase yet',
      'WAIT — overpriced, expect floor to come down',
      'Urgent board — tickets with matches in the next 7 days',
      'Away trips tab — non-home city opportunities from your city\'s perspective',
      'All prices are observed resale estimates, not guaranteed',
    ],
  },
  {
    icon: '✈️',
    id: 'cityjump',
    name: 'City Jump',
    desc: 'Compare opportunistic trips to other World Cup host cities, scored from your city\'s perspective — travel ease, match quality, ticket access, and city energy.',
    bullets: [
      'Seattle perspective: Vancouver, LA, Bay Area, Dallas, Mexico City, Toronto',
      'Kansas City perspective: Dallas, Houston, Mexico City, LA, Seattle, Vancouver',
      'Sort by any factor: overall, match quality, ticket access, travel ease',
      'Expand each city for flight time, hotel notes, and "best for" summary',
    ],
  },
  {
    icon: '🍺',
    id: 'watch',
    name: 'Watch Guide',
    desc: 'Where to actually be in your city on match days. Neighborhoods rated by walk distance to the venue, vibe, and energy.',
    bullets: [
      'Seattle: SoDo · Pioneer Square · Capitol Hill · International District · Downtown · Fremont',
      'Kansas City: Power & Light · Westport · Joe\'s KC BBQ · Arrowhead tailgate',
      'Filter by walking distance, transit reach, or outdoor options',
      'Each neighborhood: spots, tips, crowd forecast, and transit advice',
    ],
  },
  {
    icon: '📰',
    id: 'news',
    name: 'Newsroom',
    desc: 'Manually curated tournament news. No scraping — signal over noise. Updated regularly with stories worth reading.',
    bullets: [
      'Categories: tournament · seattle · tickets · teams · travel · culture',
      'Relative timestamps ("2 days ago" vs static dates)',
      'Featured articles pinned above the fold',
    ],
  },
  {
    icon: '👕',
    id: 'culture',
    name: 'Culture Tracker',
    desc: 'Kits, merch drops, fan moments, and the aesthetic layer of the tournament.',
    bullets: [
      'Filter by: kit · merch · moment · culture',
      'Star ratings on kits',
      'Teams, release dates, where to buy',
    ],
  },
  {
    icon: '📖',
    id: 'narratives',
    name: 'Narratives',
    desc: 'The 12 storylines that make the 2026 World Cup more than a tournament. Tracked from pre-tournament through the final whistle.',
    bullets: [
      'Messi\'s Last Stand · Haaland\'s arrival · USMNT on home soil · Brazil\'s drought',
      'Status: pre-tournament → building → climax → resolved',
      'Emotional stake ratings and "Watch for" guidance',
      'Chapters added as matches happen',
    ],
  },
  {
    icon: '🚨',
    id: 'upsets',
    name: 'Upset Radar',
    desc: 'Pre-tournament analysis of matches where the expected result is genuinely under threat. Risk scores 1–5.',
    bullets: [
      'South Africa vs Mexico at the Azteca — risk 4/5',
      'Egypt vs Belgium in Seattle — risk 4/5',
      'Norway vs France — Haaland vs defending runners-up — risk 4/5',
      'Updated with result (happened / didn\'t happen) as matches play out',
    ],
  },
];

const FAQ = [
  {
    q: 'Is Cup Radar affiliated with FIFA?',
    a: 'No. Cup Radar is an independent, fan-built dashboard. Official schedules, tickets, and venue information should be confirmed with official sources at fifa.com.',
  },
  {
    q: 'Where do ticket prices come from?',
    a: 'Prices are manually observed resale market estimates — not guaranteed and not for sale through this site. Always purchase through official channels (fifa.com/tickets) or verified resale platforms.',
  },
  {
    q: 'How often is the data updated?',
    a: 'During the tournament, match scores and standings update automatically if a live API key is configured. News, ticket intelligence, and Seattle/KC event data are updated manually on a rolling basis. The "updated" timestamp on each section shows when data was last refreshed.',
  },
  {
    q: 'Can I switch between Seattle and Kansas City?',
    a: 'Yes — use "Switch city" in the dashboard sidebar, or return to the homepage. Both cities have identical dashboard structures with city-specific data.',
  },
  {
    q: 'What\'s the "Should I Go?" score?',
    a: 'A 0–100 score combining match stage, expected atmosphere, ticket value, and convenience from your home city. 90+ = Don\'t miss it. 70–89 = Go. 60–69 = Consider. Under 60 = situational.',
  },
  {
    q: 'What\'s the Transit Pain Index?',
    a: 'A 1–5 rating of how difficult it is to get to the venue for a specific match. Accounts for kickoff time, day of week, crowd size, and available transit options. Very High (5) = plan your whole day around it.',
  },
  {
    q: 'Can I add matches to my calendar?',
    a: 'Yes. In the City HQ section, each match card has "+ Google Cal" and "+ iCal" buttons. There\'s also an "Add all matches to calendar" button at the top of the match schedule.',
  },
  {
    q: 'Will Cup Radar cover other host cities?',
    a: 'Seattle and Kansas City are the current HQ cities. City Jump lets you compare trips to 7+ other host cities from either home base. Additional full HQ cities may be added.',
  },
];

export default function HowItWorks() {
  return (
    <div className="hiw-page">
      {/* ── Back nav ── */}
      <div className="hiw-topnav">
        <Link to="/" className="hiw-back">← Cup Radar</Link>
      </div>

      <div className="hiw-container">
        {/* ── Hero ── */}
        <div className="hiw-hero">
          <span className="section-label">How it works</span>
          <h1 className="hiw-title">Cup Radar explained.</h1>
          <p className="hiw-subtitle">
            Cup Radar is a World Cup 2026 intelligence dashboard built for fans in Seattle and Kansas City.
            It organizes matches, tickets, city logistics, and tournament stories into one daily command center —
            rooted in your home city, aware of everything else.
          </p>
          <div className="hiw-ctas">
            <Link to="/seattle/hq"    className="btn btn-primary">Open Seattle HQ</Link>
            <Link to="/kansascity/hq" className="btn btn-secondary">Open Kansas City HQ</Link>
          </div>
        </div>

        {/* ── Two-city model ── */}
        <section className="hiw-section">
          <h2 className="hiw-section-title">Two cities. One engine.</h2>
          <p className="hiw-section-body">
            Cup Radar is structured around your home city. Choose Seattle or Kansas City on the landing page —
            your City HQ, Watch Guide, City Jump, and Ticket Radar all adjust to your perspective.
            Shared sections (Match Tracker, Groups, Bracket, Newsroom, Culture, Narratives, Upsets)
            are the same for both cities but default-filter to your city where relevant.
          </p>
          <div className="hiw-city-pills">
            <div className="hiw-city-pill seattle">
              <span>🏟️</span>
              <div>
                <div className="hiw-city-pill__name">Seattle</div>
                <div className="hiw-city-pill__detail">6 matches · Jun 15–Jul 6 · Lumen Field · R16</div>
              </div>
            </div>
            <div className="hiw-city-pill kc">
              <span>🏈</span>
              <div>
                <div className="hiw-city-pill__name">Kansas City</div>
                <div className="hiw-city-pill__detail">6 matches · Jun 16–Jul 11 · Kansas City Stadium · QF</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Sections grid ── */}
        <section className="hiw-section">
          <h2 className="hiw-section-title">The 11 dashboard sections.</h2>
          <div className="hiw-sections-grid">
            {SECTIONS.map(s => (
              <div key={s.id} className="hiw-section-card">
                <div className="hiw-section-card__top">
                  <span className="hiw-section-card__icon">{s.icon}</span>
                  <span className="hiw-section-card__name">{s.name}</span>
                </div>
                <p className="hiw-section-card__desc">{s.desc}</p>
                <ul className="hiw-section-card__bullets">
                  {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Data model ── */}
        <section className="hiw-section">
          <h2 className="hiw-section-title">How the data works.</h2>
          <div className="hiw-data-grid">
            <div className="hiw-data-card">
              <div className="hiw-data-card__icon">📡</div>
              <div className="hiw-data-card__title">Live scores & standings</div>
              <p className="hiw-data-card__body">
                When configured, Cup Radar connects to <strong>football-data.org</strong> for live match scores
                and group standings. Updates every 60 seconds during live matches, every 5 minutes otherwise.
                Falls back to local data if the API is unavailable.
              </p>
            </div>
            <div className="hiw-data-card">
              <div className="hiw-data-card__icon">🌤️</div>
              <div className="hiw-data-card__title">Matchday weather</div>
              <p className="hiw-data-card__body">
                Match cards show a live weather forecast from <strong>OpenWeatherMap</strong> when the match
                is within 5 days. Beyond that window, a placeholder is shown. Forecasts update hourly.
              </p>
            </div>
            <div className="hiw-data-card">
              <div className="hiw-data-card__icon">📋</div>
              <div className="hiw-data-card__title">Curated data</div>
              <p className="hiw-data-card__body">
                Tickets, news, narratives, events, and city intelligence are manually curated and updated
                regularly. Each section shows a "last updated" timestamp. Prices are observed market
                estimates — not guaranteed.
              </p>
            </div>
            <div className="hiw-data-card">
              <div className="hiw-data-card__icon">🗓️</div>
              <div className="hiw-data-card__title">Calendar export</div>
              <p className="hiw-data-card__body">
                All Seattle and Kansas City matches can be exported to Google Calendar or Apple Calendar
                directly from the City HQ section. Match times are converted from local venue timezone
                to UTC for accurate calendar entries.
              </p>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="hiw-section">
          <h2 className="hiw-section-title">FAQ.</h2>
          <div className="hiw-faq">
            {FAQ.map((item, i) => (
              <div key={i} className="hiw-faq-item">
                <div className="hiw-faq-q">{item.q}</div>
                <div className="hiw-faq-a">{item.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Disclaimer ── */}
        <section className="hiw-section hiw-disclaimer-section">
          <p className="hiw-disclaimer">
            Cup Radar is an independent, fan-built dashboard and is not affiliated with FIFA,
            the FIFA World Cup 2026™, or any official tournament entity. Official schedules, tickets,
            and venue information should be confirmed with official sources. Match dates, venue assignments,
            and team information are subject to change. All ticket prices are observed market estimates only
            — not guaranteed, and not sold through this site.
          </p>
          <p className="hiw-disclaimer" style={{ marginTop: 8 }}>
            Built by <a href="https://ngengwe.com" target="_blank" rel="noopener noreferrer">HK Clearway LLC</a>,
            powered by becomiNG. © {new Date().getFullYear()} HK Clearway LLC. All rights reserved.
          </p>
        </section>
      </div>
    </div>
  );
}
