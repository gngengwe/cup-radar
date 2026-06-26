import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useState, lazy, Suspense, useEffect, useRef } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import IntroBanner from '../components/IntroBanner';
import DashSidebar from '../components/DashSidebar';
import { CITY_META, buildNav } from '../data/cityNav';
import { setLastCity } from '../utils/lastCity';

// City-specific sections (lazy-loaded per city)
const SeattleHQ          = lazy(() => import('../dashboard/SeattleHQ'));
const KansasCityHQ       = lazy(() => import('../dashboard/KansasCityHQ'));
const MiamiHQ            = lazy(() => import('../dashboard/MiamiHQ'));
const NewYorkHQ          = lazy(() => import('../dashboard/NewYorkHQ'));
const PhillyHQ           = lazy(() => import('../dashboard/PhillyHQ'));
const AtlantaHQ          = lazy(() => import('../dashboard/AtlantaHQ'));
const VancouverHQ        = lazy(() => import('../dashboard/VancouverHQ'));
const LAHQ               = lazy(() => import('../dashboard/LAHQ'));

// Shared sections (lazy-loaded once)
const Matches            = lazy(() => import('../dashboard/Matches'));
const Groups             = lazy(() => import('../dashboard/Groups'));
const Bracket            = lazy(() => import('../dashboard/Bracket'));
const TicketPulse        = lazy(() => import('../dashboard/TicketPulse'));
const SeattleWatchGuide  = lazy(() => import('../dashboard/WatchGuide'));
const KCWatchGuide       = lazy(() => import('../dashboard/KCWatchGuide'));
const MiamiWatchGuide    = lazy(() => import('../dashboard/MiamiWatchGuide'));
const NewYorkWatchGuide  = lazy(() => import('../dashboard/NewYorkWatchGuide'));
const PhillyWatchGuide   = lazy(() => import('../dashboard/PhillyWatchGuide'));
const AtlantaWatchGuide  = lazy(() => import('../dashboard/AtlantaWatchGuide'));
const VancouverWatchGuide = lazy(() => import('../dashboard/VancouverWatchGuide'));
const LAWatchGuide       = lazy(() => import('../dashboard/LAWatchGuide'));
const Newsroom           = lazy(() => import('../dashboard/Newsroom'));
const NarrativeTracker   = lazy(() => import('../dashboard/NarrativeTracker'));
const UpsetRadar         = lazy(() => import('../dashboard/UpsetRadar'));
const TeamIQ             = lazy(() => import('../dashboard/TeamIQ'));
const AllTeams           = lazy(() => import('../dashboard/AllTeams'));
const AllGames           = lazy(() => import('../dashboard/AllGames'));

const CITY_CONFIG = {
  seattle:    { ...CITY_META.seattle,    hqSection: SeattleHQ,    watchSection: SeattleWatchGuide },
  kansascity: { ...CITY_META.kansascity, hqSection: KansasCityHQ, watchSection: KCWatchGuide },
  miami:      { ...CITY_META.miami,      hqSection: MiamiHQ,      watchSection: MiamiWatchGuide },
  newyork:    { ...CITY_META.newyork,    hqSection: NewYorkHQ,    watchSection: NewYorkWatchGuide },
  philly:     { ...CITY_META.philly,     hqSection: PhillyHQ,     watchSection: PhillyWatchGuide },
  atlanta:    { ...CITY_META.atlanta,    hqSection: AtlantaHQ,    watchSection: AtlantaWatchGuide },
  vancouver:  { ...CITY_META.vancouver,  hqSection: VancouverHQ,  watchSection: VancouverWatchGuide },
  losangeles: { ...CITY_META.losangeles, hqSection: LAHQ,         watchSection: LAWatchGuide },
};

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
    watch:      cfg.watchSection,
    news:       Newsroom,
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

  // Remember this city so the landing-page nav drawer defaults to it
  useEffect(() => { setLastCity(city); }, [city]);

  return (
    <div className="dashboard">
      <a href="#dash-content" className="skip-link">Skip to content</a>
      <DashSidebar
        city={city}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelectCity={switchCity}
        triggerRef={menuBtnRef}
      />

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
