import { useParams, NavLink, Link, Navigate, useNavigate } from 'react-router-dom';
import { useState, lazy, Suspense, useEffect, useRef } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import IntroBanner from '../components/IntroBanner';

// City-specific sections (lazy-loaded per city)
const SeattleHQ          = lazy(() => import('../dashboard/SeattleHQ'));
const KansasCityHQ       = lazy(() => import('../dashboard/KansasCityHQ'));
const MiamiHQ            = lazy(() => import('../dashboard/MiamiHQ'));
const NewYorkHQ          = lazy(() => import('../dashboard/NewYorkHQ'));
const PhillyHQ           = lazy(() => import('../dashboard/PhillyHQ'));
const AtlantaHQ          = lazy(() => import('../dashboard/AtlantaHQ'));
const VancouverHQ        = lazy(() => import('../dashboard/VancouverHQ'));

// Shared sections (lazy-loaded once)
const Matches            = lazy(() => import('../dashboard/Matches'));
const Groups             = lazy(() => import('../dashboard/Groups'));
const Bracket            = lazy(() => import('../dashboard/Bracket'));
const TicketPulse        = lazy(() => import('../dashboard/TicketPulse'));
const CityJump           = lazy(() => import('../dashboard/CityJump'));
const SeattleWatchGuide  = lazy(() => import('../dashboard/WatchGuide'));
const KCWatchGuide       = lazy(() => import('../dashboard/KCWatchGuide'));
const MiamiWatchGuide    = lazy(() => import('../dashboard/MiamiWatchGuide'));
const NewYorkWatchGuide  = lazy(() => import('../dashboard/NewYorkWatchGuide'));
const PhillyWatchGuide   = lazy(() => import('../dashboard/PhillyWatchGuide'));
const AtlantaWatchGuide  = lazy(() => import('../dashboard/AtlantaWatchGuide'));
const VancouverWatchGuide = lazy(() => import('../dashboard/VancouverWatchGuide'));
const Newsroom           = lazy(() => import('../dashboard/Newsroom'));
const CultureTracker     = lazy(() => import('../dashboard/CultureTracker'));
const NarrativeTracker   = lazy(() => import('../dashboard/NarrativeTracker'));
const UpsetRadar         = lazy(() => import('../dashboard/UpsetRadar'));
const TeamIQ             = lazy(() => import('../dashboard/TeamIQ'));
const AllTeams           = lazy(() => import('../dashboard/AllTeams'));
const AllGames           = lazy(() => import('../dashboard/AllGames'));

const CITY_CONFIG = {
  seattle: {
    label:        'Seattle HQ',
    short:        'Seattle',
    icon:         '🏟️',
    matchCount:   6,
    hqSection:    SeattleHQ,
    watchSection: SeattleWatchGuide,
    accentVar:    'var(--accent)',
  },
  kansascity: {
    label:        'Kansas City HQ',
    short:        'Kansas City',
    icon:         '🏈',
    matchCount:   6,
    hqSection:    KansasCityHQ,
    watchSection: KCWatchGuide,
    accentVar:    '#c084fc',
  },
  miami: {
    label:        'Miami HQ',
    short:        'Miami',
    icon:         '🌴',
    matchCount:   7,
    hqSection:    MiamiHQ,
    watchSection: MiamiWatchGuide,
    accentVar:    '#f43f5e',
  },
  newyork: {
    label:        'New York HQ',
    short:        'New York',
    icon:         '🗽',
    matchCount:   9,
    hqSection:    NewYorkHQ,
    watchSection: NewYorkWatchGuide,
    accentVar:    '#3b82f6',
  },
  philly: {
    label:        'Philadelphia HQ',
    short:        'Philly',
    icon:         '🦅',
    matchCount:   6,
    hqSection:    PhillyHQ,
    watchSection: PhillyWatchGuide,
    accentVar:    '#10b981',
  },
  atlanta: {
    label:        'Atlanta HQ',
    short:        'Atlanta',
    icon:         '🍑',
    matchCount:   8,
    hqSection:    AtlantaHQ,
    watchSection: AtlantaWatchGuide,
    accentVar:    '#fb923c',
  },
  vancouver: {
    label:        'Vancouver HQ',
    short:        'Vancouver',
    icon:         '🍁',
    matchCount:   7,
    hqSection:    VancouverHQ,
    watchSection: VancouverWatchGuide,
    accentVar:    '#22d3ee',
  },
};

// Nav ordered by day-to-day relevance — HQ + Team IQ front, then action, then intel
function buildNav(city) {
  const cfg = CITY_CONFIG[city];
  return [
    { id: 'hq',         label: cfg.label,           icon: cfg.icon,  desc: `${cfg.matchCount} matches` },
    { id: 'allteams',   label: 'All 48 Teams',      icon: '🌍',       desc: 'Squads & status'      },
    { id: 'allgames',   label: 'All Games',         icon: '📅',       desc: 'Search every match'   },
    { id: 'teamiq',     label: 'Country · Team IQ', icon: '🧠',      desc: 'Know every team'      },
    { id: 'matches',    label: 'Match Tracker',      icon: '⚽',      desc: 'City view'            },
    { id: 'watch',      label: 'Watch Guide',        icon: '🍺',      desc: 'Bars & neighborhoods' },
    { id: 'tickets',    label: 'Ticket Pulse',       icon: '🎫',      desc: 'Market read'          },
    { id: 'cityjump',   label: 'City Jump',          icon: '✈️',      desc: 'Trip compare'         },
    { id: '__divider__', divider: true },
    { id: 'groups',     label: 'Group Tracker',      icon: '📊',      desc: '12 groups'            },
    { id: 'bracket',    label: 'Bracket',            icon: '🏆',      desc: 'Knockout rounds'      },
    { id: 'upsets',     label: 'Upset Radar',        icon: '🚨',      desc: 'Chaos potential'      },
    { id: 'narratives', label: 'Narratives',         icon: '📖',      desc: 'Tournament stories'   },
    { id: 'news',       label: 'Newsroom',           icon: '📰',      desc: 'Latest stories'       },
    { id: 'culture',    label: 'Culture Tracker',    icon: '👕',      desc: 'Kits & moments'       },
  ];
}

function getSectionComponent(city, section) {
  const cfg = CITY_CONFIG[city];
  const map = {
    hq:         cfg.hqSection,
    allteams:   AllTeams,
    allgames:   AllGames,
    matches:    Matches,
    groups:     Groups,
    bracket:    Bracket,
    tickets:    TicketPulse,
    cityjump:   CityJump,
    watch:      cfg.watchSection,
    news:       Newsroom,
    culture:    CultureTracker,
    narratives: NarrativeTracker,
    upsets:     UpsetRadar,
    teamiq:     TeamIQ,
  };
  return map[section] || null;
}

export default function Dashboard() {
  const { city = 'seattle', section = 'hq' } = useParams();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef(null);

  const switchCity = (newCity) => {
    if (newCity === city) return;
    navigate(`/${newCity}/${section || 'hq'}`);
    setMenuOpen(false);
  };

  // Validate city — unknown slug goes to landing so user can choose a valid one
  if (!CITY_CONFIG[city]) return <Navigate to="/" replace />;

  const cfg     = CITY_CONFIG[city];
  const nav     = buildNav(city);
  const Section = getSectionComponent(city, section);

  if (!Section) return <Navigate to={`/${city}/hq`} replace />;

  const currentNav = nav.find(n => n.id === section) || nav[0];

  // Scroll to top when section changes
  useEffect(() => { window.scrollTo(0, 0); }, [section]);

  // Focus trap + Escape for mobile sidebar
  useEffect(() => {
    if (!menuOpen) return;
    const sidebar = document.getElementById('dash-sidebar');
    const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = sidebar ? Array.from(sidebar.querySelectorAll(FOCUSABLE)) : [];
    if (focusable.length) focusable[0].focus();
    const onKey = e => {
      if (e.key === 'Escape') { setMenuOpen(false); menuBtnRef.current?.focus(); return; }
      if (e.key !== 'Tab' || !focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="dashboard">
      <a href="#dash-content" className="skip-link">Skip to content</a>
      {/* ── Sidebar ── */}
      <aside id="dash-sidebar" className={`dash-sidebar${menuOpen ? ' open' : ''}`} aria-label="Dashboard navigation">
        <div className="dash-sidebar__header">
          <Link to="/" className="dash-logo">Cup<span>Radar</span></Link>
          <button className="dash-sidebar__close" onClick={() => setMenuOpen(false)} aria-label="Close menu">✕</button>
        </div>

        {/* City switcher */}
        <div className="dash-city-switcher">
          {Object.entries(CITY_CONFIG).map(([id, cfg]) => (
            <button
              key={id}
              className={`dash-city-pill${city === id ? ' active' : ''}`}
              onClick={() => switchCity(id)}
              aria-pressed={city === id}
              style={city === id ? { '--pill-accent': cfg.accentVar } : {}}
            >
              {cfg.icon} {cfg.short}
            </button>
          ))}
        </div>

        <nav className="dash-nav">
          {nav.map(n => n.divider
            ? <div key={n.id} className="dash-nav__divider" aria-hidden="true" />
            : (
              <NavLink
                key={n.id}
                to={`/${city}/${n.id}`}
                className={({ isActive }) => `dash-nav__item${isActive ? ' active' : ''}`}
                onClick={() => { setMenuOpen(false); menuBtnRef.current?.focus(); }}
              >
                <span className="dash-nav__icon">{n.icon}</span>
                <div className="dash-nav__text">
                  <span className="dash-nav__label">{n.label}</span>
                  <span className="dash-nav__desc">{n.desc}</span>
                </div>
              </NavLink>
            )
          )}
        </nav>

        <div className="dash-sidebar__footer">
          <Link to="/" className="dash-back" title="Return to city selection">← Choose city</Link>
          <Link to="/how-it-works" className="dash-back" style={{ marginTop: 6, opacity: 0.6 }}>How it works</Link>
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      {menuOpen && <div className="dash-overlay" onClick={() => setMenuOpen(false)} />}

      {/* ── Main ── */}
      <div className="dash-main">
        <div className="dash-topbar">
          <button
            ref={menuBtnRef}
            className="dash-menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="dash-sidebar"
          >
            <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
          </button>
          <div className="dash-topbar__title">
            <span>{section === 'hq' ? cfg.icon : currentNav.icon}</span>
            {section !== 'hq' && (
              <>
                <span className="dash-topbar__city">{cfg.short}</span>
                <span className="dash-topbar__sep" aria-hidden="true">·</span>
              </>
            )}
            {currentNav.label}
          </div>
          <Link to="/" className="dash-topbar__home">Cup<span>Radar</span></Link>
        </div>

        <div className="dash-content" id="dash-content">
          <IntroBanner />
          <ErrorBoundary key={section}>
            <Suspense fallback={
              <div className="dash-section-loading" role="status" aria-label="Loading section">
                Loading…
              </div>
            }>
              <Section />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
