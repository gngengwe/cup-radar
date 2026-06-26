import { useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { CITY_META, buildNav } from '../data/cityNav';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Left nav — shared between the city Dashboard (variant="dashboard": a
 * permanent column on desktop, off-canvas drawer on mobile) and the global
 * nav drawer reachable from the Navbar (variant="drawer": always off-canvas,
 * any page, any width).
 */
export default function DashSidebar({
  city,
  open,
  onClose,
  onSelectCity,
  triggerRef,
  variant = 'dashboard',
}) {
  const sidebarRef = useRef(null);
  const nav = buildNav(city);

  // Focus trap + Escape — only relevant while the drawer is actually open
  // (on desktop with variant="dashboard" the sidebar is always visible and
  // not modal, so this effect is a no-op there since `open` only toggles
  // the mobile off-canvas state).
  useEffect(() => {
    if (!open) return;
    const focusable = sidebarRef.current
      ? Array.from(sidebarRef.current.querySelectorAll(FOCUSABLE))
      : [];
    if (focusable.length) focusable[0].focus();

    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); triggerRef?.current?.focus(); return; }
      if (e.key !== 'Tab' || !focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, triggerRef]);

  const close = () => { onClose(); triggerRef?.current?.focus(); };
  const drawerClass = variant === 'drawer' ? ' dash-sidebar--drawer' : '';

  return (
    <>
      <aside
        id="dash-sidebar"
        ref={sidebarRef}
        className={`dash-sidebar${drawerClass}${open ? ' open' : ''}`}
        aria-label="Cup Radar navigation"
      >
        <div className="dash-sidebar__header">
          <Link to="/" className="dash-logo" onClick={close}>Cup<span>Radar</span></Link>
          <button className="dash-sidebar__close" onClick={close} aria-label="Close menu">✕</button>
        </div>

        <div className="dash-city-switcher">
          {Object.entries(CITY_META).map(([id, cfg]) => (
            <button
              key={id}
              className={`dash-city-pill${city === id ? ' active' : ''}`}
              onClick={() => onSelectCity(id)}
              aria-pressed={city === id}
              style={city === id ? { '--pill-accent': cfg.accentVar } : {}}
            >
              {cfg.icon} {cfg.short}
            </button>
          ))}
        </div>

        <nav className="dash-nav">
          {nav.map(n => n.divider
            ? <div key={n.id} className="dash-nav__divider" aria-hidden="true" />
            : n.external
              ? (
                <Link key={n.id} to={n.to} className="dash-nav__item dash-nav__item--external" onClick={close}>
                  <span className="dash-nav__icon">{n.icon}</span>
                  <div className="dash-nav__text">
                    <span className="dash-nav__label">{n.label}</span>
                    <span className="dash-nav__desc">{n.desc}</span>
                  </div>
                </Link>
              )
              : (
                <NavLink
                  key={n.id}
                  to={`/${city}/${n.id}`}
                  className={({ isActive }) => `dash-nav__item${isActive ? ' active' : ''}`}
                  onClick={close}
                >
                  <span className="dash-nav__icon">{n.icon}</span>
                  <div className="dash-nav__text">
                    <span className="dash-nav__label">{n.label}</span>
                    <span className="dash-nav__desc">{n.desc}</span>
                  </div>
                </NavLink>
              )
          )}
        </nav>

        <div className="dash-sidebar__footer">
          <Link to="/" className="dash-back" onClick={close} title="Return to city selection">← Choose city</Link>
          <Link to="/how-it-works" className="dash-back" style={{ marginTop: 6, opacity: 0.6 }} onClick={close}>How it works</Link>
        </div>
      </aside>

      {open && (
        <div
          className={`dash-overlay${variant === 'drawer' ? ' dash-overlay--drawer' : ''}`}
          onClick={close}
        />
      )}
    </>
  );
}
