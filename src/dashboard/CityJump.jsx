import { useState } from 'react';
import { useParams } from 'react-router-dom';
import seattleCitiesData from '../data/cities.json';
import kcCitiesData      from '../data/kc-cities.json';
import FlagImg from '../components/FlagImg';
import { getCityMeta } from '../utils/cityConfig';

const CITY_DATA = {
  seattle:    seattleCitiesData,
  kansascity: kcCitiesData,
};
const CITIES_WITH_DATA = new Set(Object.keys(CITY_DATA));

const SCORE_LABELS = {
  matchQuality: 'Match Quality',
  ticketAccess: 'Ticket Access',
  travelEase:   'Travel Ease',
  cityEnergy:   'City Energy',
  overall:      'Overall',
};

function ScoreBar({ value, max = 5 }) {
  return (
    <div className="score-bar-wrap">
      <div className="score-bar">
        <div className="score-bar__fill" style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="score-bar__num">{value}/{max}</span>
    </div>
  );
}

function CityCard({ city, expanded, onToggle }) {
  const { scores } = city;
  return (
    <div className={`city-jump-card${city.home ? ' home' : ''}${expanded ? ' expanded' : ''}`}>
      <div
        className="city-jump-card__header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        <div className="city-jump-card__top">
          <FlagImg emoji={city.flag} size={22} className="city-jump-card__flag" />
          <div className="city-jump-card__info">
            <div className="city-jump-card__name">{city.name}</div>
            <div className="city-jump-card__country">{city.country}</div>
          </div>
          <div className="city-jump-card__right">
            <span className="city-jump-card__tag">{city.tag}</span>
            <span className="city-jump-card__overall">{scores.overall}/5</span>
            <span className="city-jump-card__chevron">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
        <div className="city-jump-card__flight">
          ✈️ {city.flightFromSEA || city.flightTime || 'Flight TBD'} · {city.matches} matches · {city.stages.join(', ')}
        </div>
      </div>

      {expanded && (
        <div className="city-jump-card__details">
          <p className="city-jump-card__best-for">{city.bestFor}</p>

          <div className="city-jump-scores">
            {Object.entries(scores)
              .filter(([k]) => k !== 'overall')
              .map(([key, val]) => (
                <div key={key} className="city-jump-score-row">
                  <span className="city-jump-score-label">{SCORE_LABELS[key]}</span>
                  <ScoreBar value={val} />
                </div>
              ))}
          </div>

          <div className="city-jump-card__hotel">
            🏨 {city.hotelNote}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CityJump() {
  const [expanded, setExpanded] = useState(null);
  const [sortBy, setSortBy]     = useState('overall');
  const { city = 'seattle' }    = useParams();
  const cityMeta = getCityMeta(city);

  if (!CITIES_WITH_DATA.has(city)) {
    return (
      <div>
        <div className="dash-section-header">
          <h2 className="dash-section-title">City Jump</h2>
        </div>
        <div className="empty-state" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✈️</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Coming soon for {cityMeta.label}</div>
          <p style={{ color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto' }}>
            Trip comparison scores for departures from {cityMeta.label} are being sourced.
            Seattle and Kansas City perspectives are available now.
          </p>
        </div>
      </div>
    );
  }

  const data     = CITY_DATA[city];
  const homeCity = cityMeta.label;

  const { cities, lastUpdated } = data;
  const sorted = [...cities].sort((a, b) => (b.scores[sortBy] || 0) - (a.scores[sortBy] || 0));

  const updatedStr = new Date(lastUpdated).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">City Jump</h2>
        <span className="dash-last-updated">Updated {updatedStr}</span>
      </div>

      <p className="dash-sub-desc" style={{ marginBottom: 24 }}>
        Compare opportunistic trips across World Cup host cities — scored for match quality,
        ticket access, travel ease from {homeCity}, and city energy.
      </p>

      <div className="filter-bar">
        <span className="filter-label">Sort by</span>
        {Object.entries(SCORE_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`filter-chip${sortBy === key ? ' active' : ''}`}
            onClick={() => setSortBy(key)}
          >{label}</button>
        ))}
      </div>

      <div className="city-jump-list">
        {sorted.map(city => (
          <CityCard
            key={city.id}
            city={city}
            expanded={expanded === city.id}
            onToggle={() => setExpanded(expanded === city.id ? null : city.id)}
          />
        ))}
      </div>

      <p className="dash-disclaimer">
        Scores are subjective estimates based on publicly available information.
        Travel conditions, ticket availability, and city logistics change frequently.
        Cup Radar is not affiliated with FIFA or any airline or hotel provider.
      </p>
    </div>
  );
}
