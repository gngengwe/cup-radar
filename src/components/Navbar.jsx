import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="container">
        <div className="navbar__inner">
          <a href="/" aria-label="Cup Radar home">
            <span className="navbar__wordmark">Cup<span>Radar</span></span>
          </a>
          <div className="navbar__actions">
            <Link to="/world-cup-primer" className="navbar__tag navbar__hiw-link">New to soccer?</Link>
            <Link to="/how-it-works" className="navbar__tag navbar__hiw-link">How it works</Link>
            <span className="navbar__tag">WC 2026 · 7 Host Cities</span>
            <a href="/#choose-city" className="btn btn-primary navbar__cta">
              Choose your city
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
