import { useState } from 'react';
import { useParams } from 'react-router-dom';
import teamIQData from '../data/team-iq.json';
import FlagImg from '../components/FlagImg';
import JerseyDisplay from '../components/JerseyDisplay';
import { relativeTime } from '../utils/time';
import { useCurrencies } from '../hooks/useCurrencies';

const CONTINENT_EMOJI = {
  'Europe':               '🌍',
  'Africa':               '🌍',
  'South America':        '🌎',
  'North America':        '🌎',
  'Asia':                 '🌏',
  'Australia/Oceania':    '🌏',
  'Caribbean':            '🌎',
};

function StarRating({ n, max = 5, color = 'var(--accent)' }) {
  return (
    <div className="tiq-stars">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < n ? color : 'rgba(255,255,255,0.12)' }}>★</span>
      ))}
    </div>
  );
}

function TeamCard({ team, rateEntry }) {
  const [expanded, setExpanded] = useState(false);
  const { country, team: squad } = team;

  const continentEmoji = CONTINENT_EMOJI[country.continent] || '🌐';

  return (
    <div className={`tiq-card${expanded ? ' expanded' : ''}`}>
      {/* ── Header (always visible) ── */}
      <div
        className="tiq-card__header"
        onClick={() => setExpanded(v => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} team profile for ${team.name}`}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(v => !v); } }}
      >
        {/* Jersey + flag */}
        <div className="tiq-card__identity">
          {team.jersey && (
            <JerseyDisplay
              colors={team.jersey.colors}
              pattern={team.jersey.pattern}
              size={62}
            />
          )}
          <FlagImg emoji={team.flag} size={28} />
        </div>

        <div className="tiq-card__title-col">
          <div className="tiq-card__name">{team.name}</div>
          <div className="tiq-card__nickname">"{squad.nickname}"</div>
          <div className="tiq-card__meta">
            {continentEmoji} {country.region} · Group {team.group} · #{squad.fifaRanking} FIFA
          </div>
          <div className="tiq-card__matches">
            {team.cityMatches.map((m, i) => (
              <span key={i} className="tiq-card__match-chip">{m}</span>
            ))}
          </div>
          {team.jersey?.kitLink && (
            <a
              href={team.jersey.kitLink}
              target="_blank"
              rel="noopener noreferrer"
              className="tiq-kit-link"
              onClick={e => e.stopPropagation()}
            >
              🛒 Official kit ↗
            </a>
          )}
        </div>
        <div className="tiq-card__chevron">{expanded ? '▲' : '▼'}</div>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="tiq-card__body">

          {/* Country section */}
          <div className="tiq-section">
            <div className="tiq-section__label">🌐 Country</div>
            <div className="tiq-country-grid">
              <div className="tiq-country-stat">
                <span className="tiq-stat-label">Capital</span>
                <span className="tiq-stat-value">{country.capital}</span>
              </div>
              <div className="tiq-country-stat">
                <span className="tiq-stat-label">Population</span>
                <span className="tiq-stat-value">{country.population}</span>
              </div>
              <div className="tiq-country-stat">
                <span className="tiq-stat-label">Language</span>
                <span className="tiq-stat-value">{country.language}</span>
              </div>
              <div className="tiq-country-stat">
                <span className="tiq-stat-label">Currency</span>
                <span className="tiq-stat-value">
                  {!rateEntry
                    ? country.currency
                    : rateEntry.note
                      ? <>{rateEntry.name} ({rateEntry.code}) · <span className="tiq-rate-note">{rateEntry.note}</span></>
                      : rateEntry.rate === undefined
                        ? <>{rateEntry.name} ({rateEntry.code}) · <span className="tiq-rate-loading">…</span></>
                        : rateEntry.rate != null
                          ? <>{rateEntry.name} · 1 USD&nbsp;= {rateEntry.rate.toFixed(2)}&nbsp;{rateEntry.symbol}</>
                          : <>{rateEntry.name} ({rateEntry.code}) · <span className="tiq-rate-note">rate unavailable</span></>}
                </span>
              </div>
            </div>

            <div className="tiq-location-banner">
              <span className="tiq-location-icon">{continentEmoji}</span>
              <p className="tiq-location-text">{country.location}</p>
            </div>

            <div className="tiq-section__sublabel">Fun facts</div>
            <ul className="tiq-facts-list">
              {country.funFacts.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>

          {/* Team history section */}
          <div className="tiq-section">
            <div className="tiq-section__label">📋 World Cup History</div>
            <div className="tiq-wc-grid">
              <div className="tiq-wc-stat">
                <span className="tiq-stat-label">Appearances</span>
                <span className="tiq-stat-value large">{squad.wcAppearances}</span>
              </div>
              <div className="tiq-wc-stat">
                <span className="tiq-stat-label">Best Finish</span>
                <span className="tiq-stat-value">{squad.wcBestFinish}</span>
              </div>
              <div className="tiq-wc-stat">
                <span className="tiq-stat-label">Last WC</span>
                <span className="tiq-stat-value">{squad.lastWC}</span>
              </div>
              <div className="tiq-wc-stat">
                <span className="tiq-stat-label">FIFA Ranking</span>
                <span className="tiq-stat-value large">#{squad.fifaRanking}</span>
              </div>
            </div>
          </div>

          {/* 2026 squad section */}
          <div className="tiq-section">
            <div className="tiq-section__label">⚽ 2026 Squad</div>
            <div className="tiq-manager">Manager: <strong>{squad.manager}</strong></div>
            {team.jersey && (
              <div className="tiq-jersey-desc">
                <span className="tiq-jersey-swatch" style={{ background: team.jersey.colors[0], borderColor: team.jersey.colors[1] }} />
                <span>{team.jersey.description}</span>
                {team.jersey.kitLink && (
                  <a
                    href={team.jersey.kitLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tiq-kit-link tiq-kit-link--inline"
                  >
                    Buy ↗
                  </a>
                )}
              </div>
            )}

            <div className="tiq-players">
              {squad.starPlayers.map((p, i) => (
                <div key={i} className="tiq-player-card">
                  <div className="tiq-player-card__top">
                    <span className="tiq-player-name">{p.name}</span>
                    <span className="tiq-player-pos">{p.position}</span>
                    <span className="tiq-player-club">{p.club}</span>
                  </div>
                  <p className="tiq-player-note">{p.note}</p>
                </div>
              ))}
            </div>

            <div className="tiq-style-row">
              <div>
                <div className="tiq-section__sublabel">Playing style</div>
                <p className="tiq-style-text">{squad.style}</p>
              </div>
            </div>

            <div className="tiq-sw-row">
              <div className="tiq-sw-col">
                <div className="tiq-section__sublabel">Strengths</div>
                <ul className="tiq-sw-list strengths">
                  {squad.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div className="tiq-sw-col">
                <div className="tiq-section__sublabel">Weaknesses</div>
                <ul className="tiq-sw-list weaknesses">
                  {squad.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* City context section */}
          <div className="tiq-section tiq-city-context">
            <div className="tiq-section__label">🏟️ Watch for in your city</div>
            <p className="tiq-watch-for">{squad.watchFor}</p>
            {(team.seattleContext || team.kcContext) && (
              <p className="tiq-city-note">{team.seattleContext || team.kcContext}</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default function TeamIQ() {
  const { city = 'seattle' }  = useParams();
  const teams                  = teamIQData[city] || [];
  const updatedStr             = relativeTime(teamIQData.lastUpdated);

  const cityLabel = city === 'kansascity' ? 'Kansas City' : 'Seattle';

  const teamCodes = teams.map(t => t.code);
  const { entries: rateEntries, updatedAt: ratesDate } = useCurrencies(teamCodes);
  const rateMap = Object.fromEntries(rateEntries.map(e => [e.tla, e]));

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">Country · Team IQ</h2>
        <span className="dash-last-updated">Updated {updatedStr}</span>
      </div>

      <p className="dash-sub-desc" style={{ marginBottom: 24 }}>
        Know every team coming to {cityLabel}. Country background, World Cup history,
        key players, style of play, and what to watch for at your venue.
        {ratesDate && <span className="tiq-rates-note"> · Rates: ECB {ratesDate}</span>}
      </p>

      <div className="tiq-list">
        {teams.map(t => <TeamCard key={t.code} team={t} rateEntry={rateMap[t.code]} />)}
      </div>

      <p className="dash-disclaimer">
        FIFA rankings and squad information are current as of the data update date.
        Rosters may change before the tournament. Cup Radar is not affiliated with FIFA.
      </p>
    </div>
  );
}
