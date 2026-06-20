// Landing page teaser for the Goal Radar / Goal Montage — a looping
// highlight reel of recent goals, each one lighting up its host city on
// the radar map as it plays. Links through to the full montage page.
import { useEffect, useMemo, useState } from 'react';
import GoalRadarMap from './GoalRadarMap';
import FlagImg from './FlagImg';
import { getGoalFeed, getCityGoalCounts } from '../utils/goalFeed';

const CYCLE_MS = 3800;

function formatDateLabel(dateStr) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function GoalMontage() {
  const feed   = useMemo(() => getGoalFeed(), []);
  const recent = useMemo(() => feed.slice(-12).reverse(), [feed]);
  const counts = useMemo(() => getCityGoalCounts(feed), [feed]);

  const [i, setI] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (recent.length < 2) return;
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setI(prev => (prev + 1) % recent.length);
        setFading(false);
      }, 260);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [recent.length]);

  if (!feed.length) return null;

  const current = recent[i];

  return (
    <section className="section goal-montage-section">
      <div className="container goal-montage">
        <div className="goal-montage__copy">
          <span className="section-label">⚽ {feed.length} goals and counting</span>
          <h2 className="section-heading">The Goal Radar.</h2>
          <p className="section-sub">
            Every goal of the tournament, mapped to the city it happened in. Watch the radar light up
            as the goals roll in — then dive into the full montage for the complete reel.
          </p>

          <div className={`goal-montage__ticker${fading ? ' is-fading' : ''}`}>
            {current && (
              <>
                <span className="goal-montage__ticker-ball">⚽</span>
                <div className="goal-montage__ticker-body">
                  <div className="goal-montage__ticker-line">
                    <FlagImg emoji={current.flag} size={18} />
                    <strong>{current.player}</strong>
                    <span className="goal-montage__ticker-minute">{current.minute}&apos;</span>
                  </div>
                  <div className="goal-montage__ticker-meta">
                    {current.team} vs {current.opponent} · {current.city} · {formatDateLabel(current.date)}
                  </div>
                </div>
              </>
            )}
          </div>

          <a href="/goal-radar" className="btn btn-primary goal-montage__cta">
            Watch the Goal Montage →
          </a>
        </div>

        <div className="goal-montage__map">
          <GoalRadarMap cityCounts={counts} activeCity={current?.venueKey} />
        </div>
      </div>
    </section>
  );
}
