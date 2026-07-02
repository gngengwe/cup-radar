import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashSidebar from './DashSidebar';
import { getLastCity, setLastCity } from '../utils/lastCity';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="container">
          <div className="navbar__inner">
            <div className="navbar__left">
              <button
                ref={menuBtnRef}
                className="navbar__menu-btn"
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={menuOpen}
                aria-controls="dash-sidebar"
              >
                <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
              </button>
              <a href="/" aria-label="Cup Radar home">
                <span className="navbar__wordmark">Cup<span>Radar</span></span>
              </a>
            </div>
            <div className="navbar__actions">
              <Link to="/world-cup-primer" className="navbar__tag navbar__hiw-link">New to soccer?</Link>
              <Link to="/how-it-works" className="navbar__tag navbar__hiw-link">How it works</Link>
              <Link to="/live-pulse" className="navbar__tag navbar__feature-link">
                <span aria-hidden="true">📡</span><span className="navbar__feature-link-label">Live Pulse</span>
              </Link>
              <Link to="/goal-radar" className="navbar__tag navbar__feature-link">
                <span aria-hidden="true">⚽</span><span className="navbar__feature-link-label">Goal Radar</span>
              </Link>
              <Link to="/stats" className="navbar__tag navbar__feature-link">
                <span aria-hidden="true">📊</span><span className="navbar__feature-link-label">By the Numbers</span>
              </Link>
              <span className="navbar__tag">WC 2026 · 8 Host Cities</span>
              <a href="/#choose-city" className="btn btn-primary navbar__cta">
                Choose your city
              </a>
            </div>
          </div>
        </div>
      </nav>

      <DashSidebar
        variant="drawer"
        city={getLastCity()}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelectCity={(newCity) => {
          setLastCity(newCity);
          setMenuOpen(false);
          navigate(`/${newCity}/hq`);
        }}
        triggerRef={menuBtnRef}
      />
    </>
  );
}
