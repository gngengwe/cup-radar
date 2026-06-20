// Full Goal Radar / Goal Montage page — a sticky radar map paired with the
// complete chronological goal feed. Hit Play to auto-advance through every
// goal of the tournament; the radar blips and the active card glows in sync.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FlagImg from '../components/FlagImg';
import GoalRadarMap from '../components/GoalRadarMap';
import { getGoalFeed, getCityGoalCounts } from '../utils/goalFeed';

const PLAY_INTERVAL_MS = 2400;

function formatDateLabel(dateStr) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function GoalMontagePage() {
  const [feed]      = useState(() => getGoalFeed());
  const [counts]    = useState(() => getCityGoalCounts(feed));
  const [active, setActive]   = useState(feed.length ? feed.length - 1 : -1);
  const [playing, setPlaying] = useState(false);
  const itemRefs = useRef({});

  useEffect(() => {
    if (!playing || feed.length < 2) return;
    const id = setInterval(() => {
      setActive(prev => (prev + 1) % feed.length);
    }, PLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [playing, feed.length]);

  useEffect(() => {
    const node = itemRefs.current[active];
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [active]);

  const activeGoal = active >= 0 ? feed[active] : null;

  return (
    <>
      <Navbar />
      <main className="goal-radar-page">
        <div className="container goal-radar-page__head">
          <Link to="/" className="goal-radar-page__back">← Cup Radar</Link>
          <span className="section-label">⚽ {feed.length} goals tracked</span>
          <h1 className="goal-radar-page__title">The Goal Montage.</h1>
          <p className="section-sub">
            Every recorded goal of the tournament, in order. Hit play and watch it travel the map —
            or jump straight to any city, any moment.
          </p>
        </div>

        <div className="container goal-radar-page__layout">
          <div className="goal-radar-page__map-col">
            <GoalRadarMap
              cityCounts={counts}
              activeCity={activeGoal?.venueKey}
              onBlipClick={(venueKey) => {
                const idx = feed.findIndex(g => g.venueKey === venueKey);
                if (idx !== -1) { setActive(idx); setPlaying(false); }
              }}
            />
            <button
              type="button"
              className={`btn ${playing ? 'btn-secondary' : 'btn-primary'} goal-radar-page__play`}
              onClick={() => setPlaying(p => !p)}
              disabled={feed.length < 2}
            >
              {playing ? '⏸ Pause Montage' : '▶ Play Montage'}
            </button>
          </div>

          <div className="goal-radar-page__feed">
            {feed.length === 0 && (
              <p className="goal-radar-page__empty">
                No goals tracked yet — check back once today&apos;s matches kick off.
              </p>
            )}
            {feed.map((g, idx) => (
              <button
                key={g.id}
                type="button"
                ref={el => { itemRefs.current[idx] = el; }}
                className={`goal-radar-page__item${idx === active ? ' is-active' : ''}`}
                onClick={() => { setActive(idx); setPlaying(false); }}
              >
                <span className="goal-radar-page__item-minute">{g.minute}&apos;</span>
                <FlagImg emoji={g.flag} size={20} />
                <div className="goal-radar-page__item-body">
                  <div className="goal-radar-page__item-player">{g.player}</div>
                  <div className="goal-radar-page__item-meta">
                    {g.homeTeam} vs {g.awayTeam} · {g.city} · {formatDateLabel(g.date)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
