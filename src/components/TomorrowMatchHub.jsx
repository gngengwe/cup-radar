import { useMemo } from 'react';
import { useMatches } from '../hooks/useMatches';
import { UpcomingCard } from './TodayMatchHub';

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TomorrowMatchHub() {
  const { matches } = useMatches();
  const tomorrow    = useMemo(getTomorrow, []);
  const tomorrowStr = useMemo(() => dateStr(tomorrow), [tomorrow]);

  const tomorrowMatches = useMemo(
    () => matches.filter(m => m.date === tomorrowStr).sort((a, b) => a.time.localeCompare(b.time)),
    [matches, tomorrowStr],
  );

  if (!tomorrowMatches.length) return null;

  const dateLabel = tomorrow.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <section className="lp-today lp-tomorrow">
      <div className="container">
        <div className="lp-today__header">
          <span className="section-label">Next Match Day</span>
          <h2 className="lp-today__heading">Tomorrow&apos;s Action</h2>
          <p className="lp-today__date">{dateLabel}</p>
        </div>

        <div className="lp-today__block">
          <div className="lp-today__upcoming-grid">
            {tomorrowMatches.map(m => (
              <UpcomingCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
