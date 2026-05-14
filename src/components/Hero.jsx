import { useState, useEffect } from 'react';
import { PRODUCT, TOURNAMENT } from '../config';
import { useCity } from '../context/CityContext';

function calcTimeLeft(isoTarget) {
  const diff = new Date(isoTarget) - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, started: true };
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000)  / 60_000),
    seconds: Math.floor((diff % 60_000)     / 1_000),
    started: false,
  };
}

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function Hero() {
  const [t, setT]     = useState(() => calcTimeLeft(TOURNAMENT.START_DATE));
  const { cityConfig } = useCity();

  useEffect(() => {
    const id = setInterval(() => setT(calcTimeLeft(TOURNAMENT.START_DATE)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="hero pitch-bg">
      {/* Decorative pitch diagram — low opacity, right side */}
      <svg
        className="hero__deco"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="250" cy="250" r="200" stroke="white" strokeWidth="1.5" />
        <circle cx="250" cy="250" r="42"  stroke="white" strokeWidth="1.5" />
        <line x1="0"   y1="250" x2="500" y2="250" stroke="white" strokeWidth="1" />
        <rect x="50"  y="165" width="78"  height="170" stroke="white" strokeWidth="1.5" />
        <rect x="50"  y="200" width="34"  height="100" stroke="white" strokeWidth="1" />
        <rect x="372" y="165" width="78"  height="170" stroke="white" strokeWidth="1.5" />
        <rect x="416" y="200" width="34"  height="100" stroke="white" strokeWidth="1" />
        <circle cx="86"  cy="290" r="4" fill="white" fillOpacity="0.5" />
        <circle cx="414" cy="290" r="4" fill="white" fillOpacity="0.5" />
      </svg>

      <div className="container">
        <div className="hero__badge-row fade-up fade-up-1">
          <span className="badge badge--accent badge--dot">World Cup 2026</span>
          <span className="badge">Seattle Host City</span>
          <span className="badge">Jun 11 – Jul 19</span>
        </div>

        <h1 className="hero__h1 fade-up fade-up-2">
          Your World Cup<br />
          <em>command center.</em>
        </h1>

        <p className="hero__sub fade-up fade-up-3">
          {PRODUCT.TAGLINE}
        </p>

        <div className="hero__ctas fade-up fade-up-4">
          <a href="/dashboard/today"               className="btn btn-primary">{PRODUCT.CTA_PRIMARY}</a>
          <a href={cityConfig.dashRoute}            className="btn btn-secondary">
            View {cityConfig.name} HQ
          </a>
        </div>

        <div className="fade-up fade-up-5">
          {t.started ? (
            <p className="hero__started" role="status">The World Cup is live — scores and updates incoming.</p>
          ) : (
            <>
              <p className="hero__countdown-label">Kickoff countdown · June 11, 2026</p>
              <div
                className="hero__countdown"
                role="timer"
                aria-label={`${t.days} days, ${t.hours} hours, ${t.minutes} minutes until World Cup kickoff`}
              >
                <div className="countdown-unit">
                  <span className="countdown-unit__num">{pad(t.days)}</span>
                  <span className="countdown-unit__label">Days</span>
                </div>
                <span className="countdown-sep">:</span>
                <div className="countdown-unit">
                  <span className="countdown-unit__num">{pad(t.hours)}</span>
                  <span className="countdown-unit__label">Hrs</span>
                </div>
                <span className="countdown-sep">:</span>
                <div className="countdown-unit">
                  <span className="countdown-unit__num">{pad(t.minutes)}</span>
                  <span className="countdown-unit__label">Min</span>
                </div>
                <span className="countdown-sep">:</span>
                <div className="countdown-unit">
                  <span className="countdown-unit__num">{pad(t.seconds)}</span>
                  <span className="countdown-unit__label">Sec</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
