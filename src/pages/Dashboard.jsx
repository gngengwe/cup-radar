import { useParams, NavLink, Link, Navigate } from 'react-router-dom';
import { useState, lazy, Suspense, useEffect, useRef } from 'react';

// City-specific sections (lazy-loaded per city)
const SeattleHQ      = lazy(() => import('../dashboard/SeattleHQ'));
const KansasCityHQ   = lazy(() => import('../dashboard/KansasCityHQ'));

// Shared sections (lazy-loaded once)
const Matches         = lazy(() => import('../dashboard/Matches'));
const Groups          = lazy(() => import('../dashboard/Groups'));
const Bracket         = lazy(() => import('../dashboard/Bracket'));
const TicketRadar     = lazy(() => import('../dashboard/TicketRadar'));
const CityJump        = lazy(() => import('../dashboard/CityJump'));
const SeattleWatchGuide = lazy(() => import('../dashboard/WatchGuide'));
const KCWatchGuide      = lazy(() => import('../dashboard/KCWatchGuide'));
const Newsroom        = lazy(() => import('../dashboard/Newsroom'));
const CultureTracker  = lazy(() => import('../dashboard/CultureTracker'));
const NarrativeTracker= lazy(() => import('../dashboard/NarrativeTracker'));
const UpsetRadar      = lazy(() => import('../dashboard/UpsetRadar'));

const CITY_CONFIG = {
  seattle: {
    label:        'Seattle HQ',
    short:        'Seattle',
    icon:         '🏟️',
    hqSection:    SeattleHQ,
    watchSection: SeattleWatchGuide,
    accentVar:    'var(--accent)',
  },
  kansascity: {
    label:        'Kansas City HQ',
    short:        'Kansas City',
    icon:         '🏈',
    hqSection:    KansasCityHQ,
    watchSection: KCWatchGuide,
    accentVar:    '#c084fc',
  },
};

// Nav is identical for both cities — only the HQ item label/icon differs per city
function buildNav(city) {
  const cfg = CITY_CONFIG[city];
  return [
    { id: 'hq',         label: cfg.label,          icon: cfg.icon,  desc: '6 matches'           },
    { id: 'matches',    label: 'Match Tracker',     icon: '⚽',      desc: 'All fixtures'        },
    { id: 'groups',     label: 'Group Tracker',     icon: '📊',      desc: '12 groups'           },
    { id: 'bracket',    label: 'Bracket',           icon: '🏆',      desc: 'Knockout rounds'     },
    { id: 'tickets',    label: 'Ticket Radar',      icon: '🎫',      desc: 'Opportunities'       },
    { id: 'cityjump',   label: 'City Jump',         icon: '✈️',      desc: 'Trip compare'        },
    { id: 'watch',      label: 'Watch Guide',       icon: '🍺',      desc: 'Bars & neighborhoods'},
    { id: 'news',       label: 'Newsroom',          icon: '📰',      desc: 'Latest stories'      },
    { id: 'culture',    label: 'Culture Tracker',   icon: '👕',      desc: 'Kits & moments'      },
    { id: 'narratives', label: 'Narratives',        icon: '📖',      desc: 'Tournament stories'  },
    { id: 'upsets',     label: 'Upset Radar',       icon: '🚨',      desc: 'Chaos potential'     },
  ];
}

function getSectionComponent(city, section) {
  const cfg = CITY_CONFIG[city];
  const map = {
    hq:         cfg.hqSection,
    matches:    Matches,
    groups:     Groups,
    bracket:    Bracket,
    tickets:    TicketRadar,
    cityjump:   CityJump,
    watch:      cfg.watchSection,
    news:       Newsroom,
    culture:    CultureTracker,
    narratives: NarrativeTracker,
    upsets:     UpsetRadar,
  };
  return map[section] || null;
}

export default function Dashboard() {
  const { city = 'seattle', section = 'hq' } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef(null);

  // Validate city
  if (!CITY_CONFIG[city]) return <Navigate to="/seattle/hq" replace />;

  const cfg     = CITY_CONFIG[city];
  const nav     = buildNav(city);
  const Section = getSectionComponent(city, section);

  if (!Section) return <Navigate to={`/${city}/hq`} replace />;

  const currentNav = nav.find(n => n.id === section) || nav[0];

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
      {/* ── Sidebar ── */}
      <aside id="dash-sidebar" className={`dash-sidebar${menuOpen ? ' open' : ''}`} aria-label="Dashboard navigation">
        <div className="dash-sidebar__header">
          <Link to="/" className="dash-logo">Cup<span>Radar</span></Link>
          <button className="dash-sidebar__close" onClick={() => setMenuOpen(false)} aria-label="Close menu">✕</button>
        </div>

        {/* City badge */}
        <div className="dash-city-badge" style={{ color: cfg.accentVar, borderColor: cfg.accentVar }}>
          {cfg.icon} {cfg.short}
        </div>

        <nav className="dash-nav">
          {nav.map(n => (
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
          ))}
        </nav>

        <div className="dash-sidebar__footer">
          <Link to="/" className="dash-back">← Switch city</Link>
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
            <span>{currentNav.icon}</span>
            {currentNav.label}
          </div>
          <Link to="/" className="dash-topbar__home">Cup<span>Radar</span></Link>
        </div>

        <div className="dash-content">
          <Suspense fallback={<div className="dash-section-loading">Loading…</div>}>
            <Section />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
