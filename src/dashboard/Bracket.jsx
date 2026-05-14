import { useState } from 'react';
import bracketData from '../data/bracket.json';
import FlagImg from '../components/FlagImg';

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', color: 'var(--text-dim)' },
  live:     { label: '● Live',   color: 'var(--accent)'   },
  finished: { label: 'FT',       color: 'var(--text-muted)' },
};

function BracketMatch({ match }) {
  const cfg     = STATUS_CONFIG[match.status] || STATUS_CONFIG.upcoming;
  const isDone  = match.status === 'finished';
  const isLive  = match.status === 'live';
  const isTbd   = match.home === 'TBD' && match.away === 'TBD';

  return (
    <div className={`bracket-match${match.seattleMatch ? ' seattle' : ''}${isLive ? ' live' : ''}${isTbd ? ' tbd' : ''}`}>
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
        <span className="bracket-match__status" style={{ color: cfg.color }}>{cfg.label}</span>
        {match.seattleMatch && <span className="match-row__seattle-tag">SEA</span>}
      </div>
    </div>
  );
}

function RoundGrid({ round }) {
  return (
    <div className="bracket-round">
      <div className="bracket-round__header">
        <span className="bracket-round__name">{round.name}</span>
        <span className="bracket-round__dates">{round.dates}</span>
      </div>
      <div className={`bracket-matches-grid ${round.id}`}>
        {round.matches.map(m => <BracketMatch key={m.id} match={m} />)}
      </div>
    </div>
  );
}

export default function Bracket() {
  const { rounds, lastUpdated } = bracketData;
  const [activeRound, setActiveRound] = useState('r32');

  const current = rounds.find(r => r.id === activeRound) || rounds[0];

  const updatedStr = new Date(lastUpdated).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  // Count Seattle matches across all rounds
  const seattleKO = rounds.flatMap(r => r.matches).filter(m => m.seattleMatch).length;

  return (
    <div>
      <div className="dash-section-header">
        <h1 className="dash-section-title">Knockout Bracket</h1>
        <span className="dash-last-updated">Updated {updatedStr}</span>
      </div>

      <p className="dash-sub-desc" style={{ marginBottom: 20 }}>
        32 teams advance from group stage. Seattle hosts {seattleKO} knockout match{seattleKO !== 1 ? 'es' : ''}.
        Teams populate as group stage concludes.
      </p>

      {/* ── Round tabs ── */}
      <div className="bracket-tabs">
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

      <RoundGrid round={current} />

      <p className="dash-disclaimer">
        Bracket structure is based on FIFA 2026 tournament format. Match assignments and city venues
        are subject to change. Seattle knockout matches are approximate — verify with official FIFA sources.
        Cup Radar is not affiliated with FIFA.
      </p>
    </div>
  );
}
