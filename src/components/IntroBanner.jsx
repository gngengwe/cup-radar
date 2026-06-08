import { useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'cupradar_seen_intro';

export default function IntroBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  });

  if (dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setDismissed(true);
  };

  return (
    <div className="intro-banner" role="status">
      <span className="intro-banner__text">
        New here? <Link to="/how-it-works" onClick={dismiss}>See how Cup Radar works →</Link>
      </span>
      <button className="intro-banner__close" onClick={dismiss} aria-label="Dismiss this banner">✕</button>
    </div>
  );
}
