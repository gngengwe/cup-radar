import { useState, useEffect } from 'react';
import { PRODUCT } from '../config';

// Navbar is outside CityProvider, so read preference from localStorage directly
function getCityLabel() {
  try {
    const stored = localStorage.getItem('cup_radar_hq');
    if (stored === 'kansascity') return 'WC 2026 · Kansas City HQ';
  } catch {}
  return 'WC 2026 · Seattle HQ';
}

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [cityLabel,  setCityLabel]  = useState(() => getCityLabel());

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Update tag when localStorage changes (e.g., user picks a city on this page)
  useEffect(() => {
    const handler = () => setCityLabel(getCityLabel());
    window.addEventListener('storage', handler);
    // Also poll briefly after mount in case it changed during same-tab render
    const t = setTimeout(() => setCityLabel(getCityLabel()), 50);
    return () => { window.removeEventListener('storage', handler); clearTimeout(t); };
  }, []);

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="container">
        <div className="navbar__inner">
          <a href="/" aria-label="Cup Radar home">
            <span className="navbar__wordmark">Cup<span>Radar</span></span>
          </a>
          <div className="navbar__actions">
            <span className="navbar__tag">{cityLabel}</span>
            <a href="/dashboard/today" className="btn btn-primary navbar__cta">
              {PRODUCT.CTA_PRIMARY}
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
