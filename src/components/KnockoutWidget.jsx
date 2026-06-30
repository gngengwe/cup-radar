import { useState, useMemo } from 'react';
import bracketData from '../data/bracket.json';
import FlagImg from './FlagImg';

function todayDateStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function KnockoutCard({ match }) {
  const isTbd = /^(TBD|Winner |Loser )/i.test(match.home) || /^(TBD|Winner |Loser )/i.test(match.away);
  const isDone = match.status === 'finished';
  const isLive = match.status === 'live';

  const dateLabel = match.date
    ? new Date(match.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <div className={`bracket-match${isTbd ? ' tbd' : ''}${isLive ? ' live' : ''}`}>
      {match.label && <div className="bracket-match__label">{match.label}</div>}

      <div className="bracket-match__row">
        <FlagImg emoji={match.homeFlag} size={16} />
        <span className={`bracket-match__team${isDone && match.homeScore > match.awayScore ? ' winner' : ''}`}>
          {match.home}
        </span>
        {(isDone || isLive) && (
          <span className="bracket-match__score">{match.homeScore ?? '–'}</span>
        )}
      </div>

      <div className="bracket-match__row">
        <FlagImg emoji={match.awayFlag} size={16} />
        <span className={`bracket-match__team${isDone && match.awayScore > match.homeScore ? ' winner' : ''}`}>
          {match.away}
        </span>
        {(isDone || isLive) && (
          <span className="bracket-match__score">{match.awayScore ?? '–'}</span>
        )}
      </div>

      <div className="bracket-match__footer">
        <span className="bracket-match__city">{match.city !== 'TBD' ? match.city : ''}</span>
        <span className="bracket-match__status" style={{ color: 'var(--text-dim)' }}>
          {isDone ? 'FT' : isLive ? '● Live' : dateLabel}
        </span>
      </div>
    </div>
  );
}

export default function KnockoutWidget() {
  const today = useMemo(todayDateStr, []);
  const { rounds } = bracketData;

  // Auto-select the round that contains today's date, or the next upcoming one.
  const defaultRound = useMemo(() => {
    const active = rounds.find(r =>
      r.matches.some(m => m.date >= today && m.status !== 'finished')
    );
    return (active || rounds[0]).id;
  }, [today, rounds]);

  const [activeRound, setActiveRound] = useState(defaultRound);
  const current = rounds.find(r => r.id === activeRound) || rounds[0];

  return (
    <section className="lp-today">
      <div className="container">
        <div className="lp-today__header">
          <span className="section-label">Knockout Phase</span>
          <h2 className="lp-today__heading">Road to the Final</h2>
          <p className="lp-today__date">July 19 · MetLife Stadium, New York</p>
        </div>

        <div className="bracket-tabs" style={{ marginBottom: 20 }}>
          {rounds.map(r => (
            <button
              key={r.id}
              className={`bracket-tab${activeRound === r.id ? ' active' : ''}`}
              onClick={() => setActiveRound(r.id)}
            >
              <span className="bracket-tab__short">{r.shortName}</span>
              <span className="bracket-tab__dates">{r.dates}</span>
            </button>
          ))}
        </div>

        <div className={`bracket-matches-grid ${current.id}`}>
          {current.matches.map(m => (
            <KnockoutCard key={m.id} match={m} />
          ))}
        </div>
      </div>
    </section>
  );
}
