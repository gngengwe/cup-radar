import { useState } from 'react';
import neighborhoodData from '../data/neighborhoods.json';

const FILTERS = [
  { id: 'all',      label: 'All neighborhoods' },
  { id: 'walking',  label: '🚶 Walking distance' },
  { id: 'transit',  label: '🚇 Transit reach'    },
  { id: 'outdoor',  label: '☀️ Outdoor options'   },
];

const WALKING_IDS  = ['sodo', 'pioneer-square', 'international-district'];
const TRANSIT_IDS  = ['capitol-hill', 'downtown', 'fremont'];

function EnergyDots({ rating }) {
  return (
    <div className="energy-dots">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`energy-dot${n <= rating ? ' active' : ''}`} />
      ))}
    </div>
  );
}

function SpotCard({ spot }) {
  return (
    <div className="spot-card">
      <div className="spot-card__top">
        <span className="spot-card__name">{spot.name}</span>
        <span className="spot-card__type">{spot.type}</span>
        {spot.outdoor && <span className="spot-card__outdoor">☀️ Outdoor</span>}
      </div>
      <div className="spot-card__distance">📍 {spot.distance}</div>
      <div className="spot-card__tip">{spot.tip}</div>
    </div>
  );
}

function NeighborhoodCard({ hood, expanded, onToggle }) {
  const hasOutdoor = hood.spots.some(s => s.outdoor);

  return (
    <div className={`hood-card${expanded ? ' expanded' : ''}`}>
      {/* ── Header ── */}
      <div className="hood-card__header" onClick={onToggle} role="button" tabIndex={0}>
        <div className="hood-card__top-row">
          <div className="hood-card__title-group">
            <h3 className="hood-card__name">{hood.name}</h3>
            <p className="hood-card__tagline">{hood.tagline}</p>
          </div>
          <div className="hood-card__meta">
            <EnergyDots rating={hood.energyRating} />
            <span className="hood-card__chevron">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>

        <div className="hood-card__summary-row">
          <span className="hood-card__walk">🚶 {hood.walkToLumen}</span>
          <span className="hood-card__crowd">👥 {hood.crowdLevel}</span>
          {hasOutdoor && <span className="hood-card__badge outdoor">Outdoor</span>}
        </div>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="hood-card__body">
          <div className="hood-card__transit">
            <span className="hood-card__transit-label">Transit to Lumen:</span>
            {hood.transitToLumen}
          </div>

          <p className="hood-card__vibe">"{hood.vibe}"</p>
          <p className="hood-card__best-for">
            <strong>Best for:</strong> {hood.bestFor}
          </p>

          {/* Spots */}
          <h4 className="hood-card__spots-heading">Where to go</h4>
          <div className="hood-spots-list">
            {hood.spots.map((s, i) => <SpotCard key={i} spot={s} />)}
          </div>

          {/* Match-day tips */}
          <h4 className="hood-card__spots-heading" style={{ marginTop: 20 }}>Match-day tips</h4>
          <ul className="hood-tips-list">
            {hood.matchDayTips.map((tip, i) => (
              <li key={i} className="hood-tip">{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function WatchGuide() {
  const [filter,   setFilter]   = useState('all');
  const [expanded, setExpanded] = useState('sodo'); // open SoDo by default

  const { neighborhoods, lastUpdated } = neighborhoodData;

  const filtered = neighborhoods.filter(hood => {
    if (filter === 'walking') return WALKING_IDS.includes(hood.id);
    if (filter === 'transit') return TRANSIT_IDS.includes(hood.id);
    if (filter === 'outdoor') return hood.spots.some(s => s.outdoor);
    return true;
  });

  const updatedStr = new Date(lastUpdated).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div>
      <div className="dash-section-header">
        <h1 className="dash-section-title">Watch Guide</h1>
        <span className="dash-last-updated">Updated {updatedStr}</span>
      </div>

      <p className="dash-sub-desc" style={{ marginBottom: 20 }}>
        Where to watch, drink, eat, and gather in Seattle on match days — by neighborhood,
        distance to Lumen Field, and vibe.
      </p>

      {/* ── Filters ── */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={`filter-chip${filter === f.id ? ' active' : ''}`}
            onClick={() => setFilter(f.id)}
          >{f.label}</button>
        ))}
      </div>

      {/* ── Distance legend ── */}
      <div className="hood-legend">
        <span className="hood-legend-item walk">🚶 Walking distance to Lumen Field</span>
        <span className="hood-legend-item transit">🚇 Link Light Rail recommended</span>
      </div>

      {/* ── Neighborhood cards ── */}
      <div className="hood-list">
        {filtered.map(hood => (
          <NeighborhoodCard
            key={hood.id}
            hood={hood}
            expanded={expanded === hood.id}
            onToggle={() => setExpanded(expanded === hood.id ? null : hood.id)}
          />
        ))}
      </div>

      {/* ── Transit reminder ── */}
      <div className="hood-transit-banner">
        <div className="hood-transit-banner__icon">🚇</div>
        <div>
          <strong>Always take Link Light Rail on match days.</strong> Sound Transit runs trains
          every 8 minutes during events. Stadium Station is 1 block from Lumen Field's north gate.
          Rideshare and driving will cost you 30–60 extra minutes.
        </div>
      </div>

      <p className="dash-disclaimer">
        Venue hours, World Cup programming, and transit schedules are subject to change.
        Confirm with venues before match day. Cup Radar is not affiliated with FIFA.
      </p>
    </div>
  );
}
