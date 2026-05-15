import { useState } from 'react';
import cultureData from '../data/culture.json';
import JerseyDisplay from '../components/JerseyDisplay';
import { getJersey } from '../utils/teamData';

const TYPE_CONFIG = {
  kit:     { label: 'Kit',     icon: '👕', color: 'var(--accent)' },
  merch:   { label: 'Merch',   icon: '🛍️', color: '#ffb84d' },
  moment:  { label: 'Moment',  icon: '⚡', color: '#c084fc' },
  culture: { label: 'Culture', icon: '🌍', color: '#4d8eff' },
};

function RatingStars({ rating }) {
  return (
    <div className="culture-rating">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`star${i < rating ? ' active' : ''}`}>★</span>
      ))}
    </div>
  );
}

function CultureCard({ item }) {
  const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.culture;

  return (
    <div className="culture-card">
      <div className="culture-card__top">
        <span className="culture-card__type" style={{ color: typeCfg.color }}>
          {typeCfg.icon} {typeCfg.label}
        </span>
        {item.rating && <RatingStars rating={item.rating} />}
      </div>

      {/* Jersey SVG for kit items */}
      {item.type === 'kit' && item.teamCode && getJersey(item.teamCode) && (
        <div className="culture-card__jersey">
          <JerseyDisplay
            colors={getJersey(item.teamCode).colors}
            pattern={getJersey(item.teamCode).pattern}
            size={68}
          />
        </div>
      )}

      {item.teamFlag && item.teamCode && (
        <div className="culture-card__team">
          {item.teamFlag} {item.team}
        </div>
      )}

      <div className="culture-card__title">{item.title}</div>
      <div className="culture-card__desc">{item.description}</div>

      {item.available && (
        <div className="culture-card__footer">
          <span className="culture-card__price">{item.price}</span>
          <div className="culture-card__tags">
            {item.tags?.map(tag => (
              <span key={tag} className="culture-card__tag">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {item.date && (
        <div className="culture-card__date">{item.date}</div>
      )}
    </div>
  );
}

export default function CultureTracker() {
  const [filter, setFilter] = useState('all');

  const { items, lastUpdated } = cultureData;

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

  const updatedStr = new Date(lastUpdated).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">Culture Tracker</h2>
        <span className="dash-last-updated">Updated {updatedStr}</span>
      </div>

      <p className="dash-sub-desc" style={{ marginBottom: 24 }}>
        Kits, fan moments, merch drops, and the cultural energy of the tournament.
      </p>

      <div className="filter-bar">
        {['all', 'kit', 'merch', 'moment', 'culture'].map(f => (
          <button
            key={f}
            className={`filter-chip${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : TYPE_CONFIG[f]?.icon + ' ' + TYPE_CONFIG[f]?.label}
          </button>
        ))}
      </div>

      <div className="culture-grid">
        {filtered.map(item => <CultureCard key={item.id} item={item} />)}
        {filtered.length === 0 && (
          <div className="empty-state">Nothing in this category yet.</div>
        )}
      </div>

      <p className="dash-disclaimer">
        Cup Radar is an independent fan-built dashboard and is not affiliated with FIFA,
        Adidas, Nike, PUMA, or any kit manufacturer.
      </p>
    </div>
  );
}
