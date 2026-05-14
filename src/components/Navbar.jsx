import { useState, useEffect } from 'react';

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
            <span className="navbar__tag">WC 2026 · Seattle · Kansas City</span>
            <a href="/#choose-city" className="btn btn-primary navbar__cta">
              Choose your city
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
