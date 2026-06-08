import { useState } from 'react';
import narrativeData from '../data/narratives.json';
import FlagImg from '../components/FlagImg';

const STATUS_CONFIG = {
  'pre-tournament': { label: 'Pre-tournament',  color: 'var(--blue)',        bg: 'var(--blue-soft)'   },
  'building':       { label: 'Building',         color: '#ffb84d',            bg: 'rgba(255,184,77,.1)' },
  'climax':         { label: 'Climax',           color: 'var(--accent)',      bg: 'var(--accent-soft)' },
  'resolved':       { label: 'Resolved',         color: 'var(--text-muted)',  bg: 'rgba(255,255,255,.05)' },
};

const CAT_ICONS = {
  player:  '⭐',
  team:    '🏳️',
  format:  '📋',
  rivalry: '⚔️',
  moment:  '⚡',
};

const FILTERS = ['all', 'player', 'team', 'format', 'rivalry', 'moment'];

function StakeDots({ rating }) {
  return (
    <div
      className="stake-dots"
      title={`Emotional stake: ${rating}/5`}
      aria-label={`Emotional stake: ${rating} out of 5`}
    >
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`stake-dot${n <= rating ? ' active' : ''}`} />
      ))}
    </div>
  );
}

function NarrativeCard({ narrative, expanded, onToggle }) {
  const statusCfg = STATUS_CONFIG[narrative.status] || STATUS_CONFIG['pre-tournament'];
  const catIcon   = CAT_ICONS[narrative.category] || '📖';

  return (
    <div className={`narrative-card${narrative.featured ? ' featured' : ''}${expanded ? ' expanded' : ''}`}>
      <div
        className="narrative-card__header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        <div className="narrative-card__top">
          <span className="narrative-card__cat">{catIcon}</span>
          <div className="narrative-card__title-wrap">
            <h3 className="narrative-card__title">{narrative.title}</h3>
            <div className="narrative-card__flags">
              {narrative.teamFlags.map((f, i) => <FlagImg key={i} emoji={f} size={18} />)}
            </div>
          </div>
          <div className="narrative-card__right">
            <span
              className="narrative-card__status"
              style={{ color: statusCfg.color, background: statusCfg.bg }}
            >{statusCfg.label}</span>
            <StakeDots rating={narrative.emotionalStake} />
            <span className="narrative-card__chevron">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>

        <p className="narrative-card__preview">
          {narrative.summary.slice(0, 120)}{narrative.summary.length > 120 ? '…' : ''}
        </p>
      </div>

      {expanded && (
        <div className="narrative-card__body">
          <p className="narrative-card__summary">{narrative.summary}</p>

          <div className="narrative-card__watch">
            <span className="narrative-card__watch-label">Watch for</span>
            <p className="narrative-card__watch-text">{narrative.watchFor}</p>
          </div>

          {narrative.chapterCount > 0 && (
            <div className="narrative-card__chapters">
              <span className="narrative-card__watch-label">{narrative.chapterCount} chapters written</span>
              {narrative.chapters.map((ch, i) => (
                <div key={i} className="narrative-chapter">
                  <span className="narrative-chapter__num">Ch.{i + 1}</span>
                  <span className="narrative-chapter__text">
                    {typeof ch === 'string' ? ch : ch.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NarrativeTracker() {
  const [filter,   setFilter]   = useState('all');
  const [expanded, setExpanded] = useState(narrativeData?.narratives?.[0]?.id ?? null);

  const { narratives, lastUpdated } = narrativeData;

  const filtered = filter === 'all'
    ? narratives
    : narratives.filter(n => n.category === filter);

  const featured = filtered.filter(n => n.featured);
  const rest     = filtered.filter(n => !n.featured);

  const updatedStr = new Date(lastUpdated).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">Narrative Tracker</h2>
        <span className="dash-last-updated">Updated {updatedStr}</span>
      </div>

      <p className="dash-sub-desc" style={{ marginBottom: 20 }}>
        The stories that make the World Cup more than a tournament. Track them from pre-kickoff through the final whistle.
      </p>

      <div className="filter-bar">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-chip${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all'     ? 'All storylines'
              : f === 'player'  ? '⭐ Player'
              : f === 'team'    ? '🏳️ Team'
              : f === 'format'  ? '📋 Format'
              : f === 'rivalry' ? '⚔️ Rivalry'
              : '⚡ Moment'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>{CAT_ICONS[filter] ?? '📖'}</div>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            No {filter} storylines tracked yet. Check back as the tournament develops.
          </p>
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <div className="narrative-section">
              <div className="narrative-section__label">Featured storylines</div>
              {featured.map(n => (
                <NarrativeCard
                  key={n.id}
                  narrative={n}
                  expanded={expanded === n.id}
                  onToggle={() => setExpanded(expanded === n.id ? null : n.id)}
                />
              ))}
            </div>
          )}

          {rest.length > 0 && (
            <div className="narrative-section">
              {featured.length > 0 && <div className="narrative-section__label">More storylines</div>}
              {rest.map(n => (
                <NarrativeCard
                  key={n.id}
                  narrative={n}
                  expanded={expanded === n.id}
                  onToggle={() => setExpanded(expanded === n.id ? null : n.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <p className="dash-disclaimer">
        Cup Radar is an independent fan-built dashboard and is not affiliated with FIFA.
      </p>
    </div>
  );
}
