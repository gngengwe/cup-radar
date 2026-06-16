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
      'Calendar export — add all matches to Google Calendar or Apple Calendar',
    ],
  },
  {
    icon: '📅',
    id: 'allgames',
    name: 'All Games',
    desc: 'The central fixture board for all 104 matches. Searchable, filterable, and live — with real-time ESPN scores and an excitement analytics layer on every completed game.',
    bullets: [
      'Search by team, city, venue, stage, group, or status — filters persist in the URL',
      'Today\'s featured match cards with ESPN live scores refreshed every 30 seconds',
      'Excitement Graph: an SVG arc tracing the 90-minute excitement story of every finished match',
      'Excitement Badges: Calm · Building · Tense · High Alert · Goal Right Here',
      'Scores and badges update from ESPN before the bot commits match data',
      'Goal log on every completed fixture',
    ],
  },
  {
    icon: '🌍',
    id: 'allteams',
    name: 'All 48 Teams',
    desc: 'Profiles for every team in the tournament — kit identity, fan culture, key players, and tournament history organized by city.',
    bullets: [
      'Kit colors and jersey patterns for every squad',
      'Fan culture signature — what makes each country\'s support feel different',
      'Key players and recent tournament history',
      'Organized by the host city they play in',
    ],
  },
  {
    icon: '⚽',
    id: 'matches',
    name: 'Match Tracker',
    desc: 'City-focused match schedule. Defaults to your city\'s fixtures with jersey displays, live scores, and countdown badges.',
    bullets: [
      'Opens on your city\'s matches by default',
      'Jersey display for teams with kit data',
      'Live scores from ESPN during active matches',
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
      'Your city\'s knockout matches highlighted',
      'Seattle: R32 (Jul 1) · R16 (Jul 6)',
      'Kansas City: R32 (Jul 3) · QF (Jul 11)',
      'Miami: R16 (Jul 7) · 3rd Place (Jul 18)',
      'New York: R32 (Jul 2) · R16 (Jul 4) · World Cup Final (Jul 19)',
      'Atlanta: SF (Jul 14)',
      'Philadelphia: QF (Jul 12) · SF (Jul 15)',
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
    icon: '🍺',
    id: 'watch',
    name: 'Watch Guide',
    desc: 'Where to actually be in your city on match days. Neighborhoods rated by walk distance to the venue, vibe, and energy.',
    bullets: [
      'Seattle: SoDo · Pioneer Square · Capitol Hill · International District · Downtown · Fremont',
      'Kansas City: Power & Light · Westport · Joe\'s KC BBQ · Arrowhead tailgate',
      'Miami: Wynwood · Brickell · South Beach · Design District',
      'New York: Midtown · Hell\'s Kitchen · East Rutherford · Hoboken',
      'Philadelphia: South Philly · Old City · Rittenhouse Square · Passyunk',
      'Atlanta: Castleberry Hill · Home Depot Backyard · Centennial Olympic Park',
      'Vancouver: Yaletown · Gastown · Granville · PNE Fan Festival',
    ],
  },
  {
    icon: '📰',
    id: 'news',
    name: 'Newsroom',
    desc: 'Manually curated tournament news. No scraping — signal over noise. Updated regularly with stories worth reading.',
    bullets: [
      'Categories: tournament · your city · tickets · teams · travel · culture',
      'Relative timestamps ("2 days ago" vs static dates)',
      'Featured articles pinned above the fold',
    ],
  },
  {
    icon: '🎓',
    id: 'primer',
    name: 'World Cup Primer',
    desc: 'The evergreen guide for new fans — rules, formations, glossary, and the fan-culture and kit identity of every team.',
    bullets: [
      'Choose your path: teach me the rules, help me pick a team, make me sound smart, explain the weird stuff',
      'Fan Culture Atlas — what makes each country\'s support feel different',
      'Adopt-a-Team recommendations based on your vibe',
      'Searchable glossary, formations, and history timeline',
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
  {
    icon: '🛠️',
    id: 'admin',
    name: 'Admin Panel',
    desc: 'Data editor — no command line needed',
    bullets: [
      'Access at wc.ngengwe.com/admin — login with a GitHub Personal Access Token',
      'Alerts tab: set tournament phase, city energy score, alerts, top 3 stories',
      'Scores tab: mark matches live, then record the final score at full time',
      'News tab: publish new articles or delete old ones by category',
      'Scenarios tab: flip group stage scenarios between Pending / Happened / Didn\'t happen',
      'Narratives tab: add chapters to storylines as the tournament unfolds, update status',
      'Bracket tab: fill in advancing teams and record knockout results round by round',
      'Upsets tab: mark each upset risk as Happened / Didn\'t happen after the match',
      'Every save commits directly to GitHub — site auto-deploys in ~40 seconds',
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
    a: 'Live match scores come from ESPN and refresh every 30 seconds during active games. Match result data (goals, final scores) is committed by a bot after each match and the site auto-deploys in ~40 seconds — the app also polls the GitHub raw URL every 5 minutes to catch updates without a page reload. News, ticket intelligence, and city data are updated manually on a rolling basis.',
  },
  {
    q: 'Can I switch between cities?',
    a: 'Yes — use the city switcher in the dashboard sidebar to toggle between Seattle, Kansas City, Miami, New York, Philadelphia, Atlanta, and Vancouver. All seven cities share the same dashboard structure with city-specific data.',
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
    q: 'Which host cities does Cup Radar cover?',
    a: 'Cup Radar covers 7 host cities with full City HQ dashboards: Seattle, Kansas City, Miami, New York, Philadelphia, Atlanta, and Vancouver. Each city has its own HQ, Watch Guide, Match Tracker, Ticket Radar, Team IQ, and city-filtered views across all shared sections.',
  },
  {
    q: 'How is the data kept up to date?',
    a: 'The admin panel at /admin lets the site owner update match scores, news articles, group stage scenarios, narratives, bracket results, and daily alerts — all through a browser-based form that commits directly to GitHub and auto-deploys in ~40 seconds. No command line needed during the tournament.',
  },
  {
    q: 'How do I access the admin panel?',
    a: 'Visit wc.ngengwe.com/admin and enter a GitHub Personal Access Token with repo read+write access. Tokens are stored in your browser sessionStorage only and cleared when you close the browser.',
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
            Cup Radar is a World Cup 2026 intelligence dashboard built for fans across 7 host cities —
            Seattle, Kansas City, Miami, New York, Philadelphia, Atlanta, and Vancouver.
            It organizes matches, tickets, city logistics, and tournament stories into one daily command center —
            rooted in your home city, aware of everything else.
          </p>
          <div className="hiw-ctas">
            <a href="/#choose-city" className="btn btn-primary">Choose your city</a>
          </div>
        </div>

        {/* ── Five-city model ── */}
        <section className="hiw-section">
          <h2 className="hiw-section-title">Seven cities. One engine.</h2>
          <p className="hiw-section-body">
            Cup Radar is structured around your home city. Choose any of the 7 host cities on the landing page —
            your City HQ, Watch Guide, and Ticket Radar all adjust to your perspective.
            Shared sections (All Games, Groups, Bracket, Newsroom, Narratives, Upsets)
            cover the full tournament but default-filter to your city where relevant.
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
                <div className="hiw-city-pill__detail">6 matches · Jun 16–Jul 11 · KC Stadium · QF</div>
              </div>
            </div>
            <div className="hiw-city-pill miami">
              <span>🌴</span>
              <div>
                <div className="hiw-city-pill__name">Miami</div>
                <div className="hiw-city-pill__detail">7 matches · Jun 15–Jul 18 · Hard Rock Stadium · QF + 3rd Place</div>
              </div>
            </div>
            <div className="hiw-city-pill newyork">
              <span>🗽</span>
              <div>
                <div className="hiw-city-pill__name">New York</div>
                <div className="hiw-city-pill__detail">9 matches · Jun 13–Jul 19 · MetLife Stadium · Final</div>
              </div>
            </div>
            <div className="hiw-city-pill philly">
              <span>🦅</span>
              <div>
                <div className="hiw-city-pill__name">Philadelphia</div>
                <div className="hiw-city-pill__detail">6 matches · Jun 14–Jul 12 · Lincoln Financial · R16</div>
              </div>
            </div>
            <div className="hiw-city-pill atlanta">
              <span>🍑</span>
              <div>
                <div className="hiw-city-pill__name">Atlanta</div>
                <div className="hiw-city-pill__detail">8 matches · Jun 15–Jul 19 · Mercedes-Benz Stadium · SF</div>
              </div>
            </div>
            <div className="hiw-city-pill vancouver">
              <span>🍁</span>
              <div>
                <div className="hiw-city-pill__name">Vancouver</div>
                <div className="hiw-city-pill__detail">7 matches · Jun 13–Jul 11 · BC Place · R16</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Sections grid ── */}
        <section className="hiw-section">
          <h2 className="hiw-section-title">The 13 dashboard sections.</h2>
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
              <div className="hiw-data-card__title">Live scores — ESPN polling</div>
              <p className="hiw-data-card__body">
                During live matches, Cup Radar polls the <strong>ESPN scoreboard API</strong> every 30 seconds
                for scores, match clock, and commentary events. This powers live score cards, the excitement
                meter, and the excitement badges — all before any manual update is needed.
                Match data (goals, final scores) is also committed to the repo by a bot and deployed automatically,
                with the GitHub raw URL polled every 5 minutes to catch updates without a page reload.
              </p>
            </div>
            <div className="hiw-data-card">
              <div className="hiw-data-card__icon">📈</div>
              <div className="hiw-data-card__title">Excitement system</div>
              <p className="hiw-data-card__body">
                Every finished match gets an <strong>Excitement Graph</strong> — a 90-minute SVG arc computed
                from a multi-factor engine: score pressure, clock leverage, stage weight, upset potential,
                attack pressure, lead-swing drama, and chaos bonus. The graph peaks at goal moments and sags
                in quiet stretches. The <strong>peak score</strong> is annotated with a band label:
                Calm · Building · Tense · High Alert · Goal Right Here. Live matches show an
                Excitement Meter instead.
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
                All matches for your city can be exported to Google Calendar or Apple Calendar
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
