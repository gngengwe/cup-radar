import { useParams, NavLink, Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import TodayMode from '../dashboard/TodayMode';
import SeattleHQ from '../dashboard/SeattleHQ';
import Matches from '../dashboard/Matches';
import Groups from '../dashboard/Groups';
import Bracket from '../dashboard/Bracket';
import WatchGuide from '../dashboard/WatchGuide';
import NarrativeTracker from '../dashboard/NarrativeTracker';
import UpsetRadar from '../dashboard/UpsetRadar';
import TicketRadar from '../dashboard/TicketRadar';
import CityJump from '../dashboard/CityJump';
import Newsroom from '../dashboard/Newsroom';
import CultureTracker from '../dashboard/CultureTracker';

const NAV = [
  { id: 'today',   label: 'Today Mode',     icon: '🌅', desc: 'Daily briefing'   },
  { id: 'seattle', label: 'Seattle HQ',      icon: '🏟️', desc: '6 matches'        },
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
  seattle: SeattleHQ,
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

  if (!SECTIONS[section]) return <Navigate to="/dashboard/today" replace />;

  const Section    = SECTIONS[section];
  const currentNav = NAV.find(n => n.id === section) || NAV[0];

  return (
    <div className="dashboard">
      {/* ── Sidebar ── */}
      <aside className={`dash-sidebar${menuOpen ? ' open' : ''}`}>
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
              onClick={() => setMenuOpen(false)}
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
            className="dash-menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <span /><span /><span />
          </button>
          <div className="dash-topbar__title">
            <span>{currentNav.icon}</span>
            {currentNav.label}
          </div>
          <Link to="/" className="dash-topbar__home">Cup<span>Radar</span></Link>
        </div>

        <div className="dash-content">
          <Section />
        </div>
      </div>
    </div>
  );
}
