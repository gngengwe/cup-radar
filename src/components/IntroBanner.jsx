import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'cupradar_seen_intro';

export default function IntroBanner() {
  const navigate = useNavigate();
  const closeBtnRef = useRef(null);
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== '1'; } catch { return true; }
  });

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const close = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setOpen(false);
  };

  const takeTour = () => {
    close();
    navigate('/how-it-works');
  };

  return (
    <div className="intro-modal-overlay" onClick={close}>
      <div
        className="intro-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-modal-title"
        onClick={e => e.stopPropagation()}
      >
        <button ref={closeBtnRef} className="intro-modal__close" onClick={close} aria-label="Close">✕</button>
        <span className="intro-modal__icon" aria-hidden="true">🧭</span>
        <h2 id="intro-modal-title" className="intro-modal__title">New to Cup Radar?</h2>
        <p className="intro-modal__text">
          Take a 60-second tour to see how the dashboard works — match tracking,
          ticket pulse, watch guides, and more, all built around your host city.
        </p>
        <div className="intro-modal__actions">
          <button className="btn btn-primary" onClick={takeTour}>See how it works →</button>
          <button className="btn btn-secondary" onClick={close}>Skip for now</button>
        </div>
      </div>
    </div>
  );
}
