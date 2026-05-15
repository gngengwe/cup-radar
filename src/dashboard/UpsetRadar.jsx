import { useState } from 'react';
import upsetData from '../data/upsets.json';
import FlagImg from '../components/FlagImg';
import JerseyDisplay from '../components/JerseyDisplay';
import { getJersey } from '../utils/teamData';

const RISK_CONFIG = {
  5: { label: 'Extreme',  color: '#f87171', bg: 'rgba(248,113,113,.12)' },
  4: { label: 'High',     color: '#ffb84d', bg: 'rgba(255,184,77,.12)'  },
  3: { label: 'Moderate', color: '#facc15', bg: 'rgba(250,204,21,.10)'  },
  2: { label: 'Low',      color: 'var(--text-muted)', bg: 'rgba(255,255,255,.05)' },
  1: { label: 'Very Low', color: 'var(--text-dim)',   bg: 'rgba(255,255,255,.03)' },
};

const RESULT_CONFIG = {
  upset:    { label: '✓ Upset happened', color: '#f87171' },
  no_upset: { label: '✗ Favorite won',   color: 'var(--text-muted)' },
  draw:     { label: '~ Draw',           color: '#ffb84d' },
};

function RiskBars({ score }) {
  return (
    <div className="risk-bars">
      {[1,2,3,4,5].map(n => (
        <div
          key={n}
          className="risk-bar"
          style={{ background: n <= score ? RISK_CONFIG[score]?.color : 'rgba(255,255,255,.08)' }}
        />
      ))}
    </div>
  );
}

function UpsetCard({ upset, expanded, onToggle }) {
  const cfg = RISK_CONFIG[upset.riskScore] || RISK_CONFIG[2];

  return (
    <div className={`upset-card${upset.riskScore >= 4 ? ' high-risk' : ''}${expanded ? ' expanded' : ''}`}>
      <div
        className="upset-card__header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        <div className="upset-card__top">
          <div className="upset-card__teams">
            {upset.teams.map((code, i) => {
              const j = getJersey(code);
              return j
                ? <JerseyDisplay key={i} colors={j.colors} pattern={j.pattern} size={38} />
                : <FlagImg key={i} emoji={upset.teamFlags[i]} size={22} />;
            })}
          </div>
          <div className="upset-card__title-group">
            <h3 className="upset-card__title">{upset.title}</h3>
            <span className="upset-card__stage">{upset.stage}{upset.date ? ` · ${new Date(upset.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
          </div>
          <div className="upset-card__risk-block">
            <RiskBars score={upset.riskScore} />
            <span className="upset-card__risk-label" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
          <span className="upset-card__chevron">{expanded ? '▲' : '▼'}</span>
        </div>

        {upset.result && (
          <div
            className="upset-card__result"
            style={{ color: RESULT_CONFIG[upset.result]?.color }}
          >{RESULT_CONFIG[upset.result]?.label}</div>
        )}
      </div>

      {expanded && (
        <div className="upset-card__body">
          <p className="upset-card__reasoning">{upset.reasoning}</p>

          <div className="upset-card__factors">
            <div className="upset-card__factors-label">Key factors</div>
            <ul>
              {upset.keyFactors.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>

          <div className="upset-card__odds">
            <span className="upset-card__odds-label">Assessment</span>
            <span className="upset-card__odds-value">{upset.upsetOdds}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UpsetRadar() {
  const [filter,   setFilter]   = useState('all');
  const [expanded, setExpanded] = useState(null);

  const { upsets, lastUpdated } = upsetData;

  const filtered = (() => {
    if (filter === 'high')     return upsets.filter(u => u.riskScore >= 4);
    if (filter === 'live')     return upsets.filter(u => u.status === 'live');
    if (filter === 'resolved') return upsets.filter(u => u.status === 'resolved');
    return upsets;
  })();

  const sorted = [...filtered].sort((a, b) => b.riskScore - a.riskScore);

  const updatedStr = new Date(lastUpdated).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const highRiskCount = upsets.filter(u => u.riskScore >= 4).length;

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">Upset Radar</h2>
        <span className="dash-last-updated">Updated {updatedStr}</span>
      </div>

      <p className="dash-sub-desc" style={{ marginBottom: 20 }}>
        {highRiskCount} high-risk upsets identified before the tournament.
        Matches where the expected result is genuinely under threat.
      </p>

      <div className="filter-bar">
        {[
          { id: 'all',      label: 'All' },
          { id: 'high',     label: '🔴 High risk' },
          { id: 'live',     label: '● In progress' },
          { id: 'resolved', label: '✓ Resolved' },
        ].map(f => (
          <button
            key={f.id}
            className={`filter-chip${filter === f.id ? ' active' : ''}`}
            onClick={() => setFilter(f.id)}
          >{f.label}</button>
        ))}
      </div>

      {/* Risk legend */}
      <div className="risk-legend">
        {[5,4,3,2].map(n => (
          <span key={n} className="risk-legend-item" style={{ color: RISK_CONFIG[n].color }}>
            ● {RISK_CONFIG[n].label}
          </span>
        ))}
      </div>

      <div className="upset-list">
        {sorted.map(u => (
          <UpsetCard
            key={u.id}
            upset={u}
            expanded={expanded === u.id}
            onToggle={() => setExpanded(expanded === u.id ? null : u.id)}
          />
        ))}
        {sorted.length === 0 && (
          <div className="empty-state">No upsets in this filter.</div>
        )}
      </div>

      <p className="dash-disclaimer">
        Upset risk scores are editorial assessments, not predictions or betting odds.
        Cup Radar is not affiliated with FIFA.
      </p>
    </div>
  );
}
