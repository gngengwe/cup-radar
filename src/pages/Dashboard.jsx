import { useParams, NavLink, Link, Navigate } from 'react-router-dom';
import { useState, lazy, Suspense, useEffect, useRef } from 'react';

// Lazy-load each dashboard section — splits into separate chunks, reducing initial bundle
const TodayMode       = lazy(() => import('../dashboard/TodayMode'));
const SeattleHQ       = lazy(() => import('../dashboard/SeattleHQ'));
const Matches         = lazy(() => import('../dashboard/Matches'));
const Groups          = lazy(() => import('../dashboard/Groups'));
const Bracket         = lazy(() => import('../dashboard/Bracket'));
const WatchGuide      = lazy(() => import('../dashboard/WatchGuide'));
const NarrativeTracker= lazy(() => import('../dashboard/NarrativeTracker'));
const UpsetRadar      = lazy(() => import('../dashboard/UpsetRadar'));
const TicketRadar     = lazy(() => import('../dashboard/TicketRadar'));
const KansasCityHQ   = lazy(() => import('../dashboard/KansasCityHQ'));
const CityJump        = lazy(() => import('../dashboard/CityJump'));
const Newsroom        = lazy(() => import('../dashboard/Newsroom'));
const CultureTracker  = lazy(() => import('../dashboard/CultureTracker'));

const NAV = [
  { id: 'today',   label: 'Today Mode',     icon: '🌅', desc: 'Daily briefing'   },
  { id: 'seattle',     label: 'Seattle HQ',      icon: '🏟️', desc: '6 matches · SEA'  },
  { id: 'kansascity',  label: 'Kansas City HQ',  icon: '🏈', desc: '6 matches · KC'   },
  { id: 'matches', label: 'Match Tracker',   icon: '⚽', desc: 'All fixtures'     },
  { id: 'groups',  label: 'Group Tracker',   icon: '📊', desc: '12 groups'        },
  { id: 'bracket', label: 'Bracket',         icon: '🏆', desc: 'Knockout rounds'  },
  { id: 'tickets', label: 'Ticket Radar',    icon: '🎫', desc: 'Opportunities'    },
  { id: 'watch',   label: 'Watch Guide',     icon: '🍺', desc: 'Bars & neighborhoods' },
  { id: 'cities',  label: 'City Jump',       icon: '✈️', desc: 'Trip compare'     },
  { id: 'narrative', label: 'Narratives',      icon: '📖', desc: 'Tournament stories' },
  { id: 'upsets',    label: 'Upset Radar',    icon: '🚨', desc: 'Chaos potential'   },
  { id: 'news',      label: 'Newsroom',       icon: '📰', desc: 'Latest stories'    },
  { id: 'culture',   label: 'Culture Tracker',icon: '👕', desc: 'Kits & moments'    },
];

const SECTIONS = {
  today:   TodayMode,
  seattle:     SeattleHQ,
  kansascity:  KansasCityHQ,
  matches: Matches,
  groups:  Groups,
  bracket: Bracket,
  tickets: TicketRadar,
  watch:     WatchGuide,
  narrative: NarrativeTracker,
  upsets:    UpsetRadar,
  cities:  CityJump,
  news:    Newsroom,
  culture: CultureTracker,
};

export default function Dashboard() {
  const { section } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef(null);

  // Focus trap + Escape key for mobile sidebar
  useEffect(() => {
    if (!menuOpen) return;

    const sidebar = document.getElementById('dash-sidebar');
    const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = sidebar ? Array.from(sidebar.querySelectorAll(FOCUSABLE)) : [];
    if (focusable.length) focusable[0].focus();

    const onKey = e => {
      if (e.key === 'Escape') { setMenuOpen(false); menuBtnRef.current?.focus(); return; }
      if (e.key !== 'Tab' || !focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  if (!SECTIONS[section]) return <Navigate to="/dashboard/today" replace />;

  const Section    = SECTIONS[section];
  const currentNav = NAV.find(n => n.id === section) || NAV[0];

  return (
    <div className="dashboard">
      {/* ── Sidebar ── */}
      <aside id="dash-sidebar" className={`dash-sidebar${menuOpen ? ' open' : ''}`} aria-label="Dashboard navigation">
        <div className="dash-sidebar__header">
          <Link to="/" className="dash-logo">Cup<span>Radar</span></Link>
          <button
            className="dash-sidebar__close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >✕</button>
        </div>

        <nav className="dash-nav">
          {NAV.map(n => (
            <NavLink
              key={n.id}
              to={`/dashboard/${n.id}`}
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
          <Link to="/" className="dash-back">← Back to home</Link>
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      {menuOpen && (
        <div className="dash-overlay" onClick={() => setMenuOpen(false)} />
      )}

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
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
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
