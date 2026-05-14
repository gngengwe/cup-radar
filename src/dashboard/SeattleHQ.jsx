import { useState } from 'react';
import { Link } from 'react-router-dom';
import matchData   from '../data/matches.json';
import seattleData from '../data/seattle.json';
import eventsData  from '../data/events.json';
import { AddAllToCalendar, AddMatchToGoogleCalendar, AddMatchToICS } from '../components/CalendarExport';
import WeatherWidget from '../components/WeatherWidget';

const seattleMatches = matchData.matches.filter(m => m.seattleMatch);

const SHOULD_GO_COLORS = {
  'Don\'t miss it': '#00e676',
  'Strongly Go':    '#00e676',
  'Go':             'var(--accent)',
  'Consider':       '#ffb84d',
  'Wait':           'var(--text-muted)',
};

function MatchCard({ match }) {
  const [expanded, setExpanded] = useState(false);

  const d         = new Date(match.date + 'T12:00:00');
  const weekday   = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateStr   = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isKnockout = match.stage !== 'Group Stage';

  const transit    = seattleData.transitPain?.find(t => t.matchId === match.id);
  const shouldIGo  = seattleData.shouldIGoScores?.find(s => s.matchId === match.id);

  return (
    <div className={`seattle-match-card${isKnockout ? ' knockout' : ''}${expanded ? ' expanded' : ''}`}>
      <div className="seattle-match-card__top">
        <span className="seattle-match-card__stage">{match.stage}</span>
        {isKnockout && <span className="seattle-match-card__badge">KO</span>}
        {shouldIGo && (
          <span
            className="seattle-match-card__sigo"
            style={{ color: SHOULD_GO_COLORS[shouldIGo.label] || 'var(--accent)' }}
          >
            {shouldIGo.score}/100
          </span>
        )}
      </div>

      <div className="seattle-match-card__date">{weekday}, {dateStr}</div>
      <div className="seattle-match-card__teams">
        {match.homeFlag} {match.homeTeam} <span className="seattle-match-card__vs">vs</span> {match.awayTeam} {match.awayFlag}
      </div>
      <div className="seattle-match-card__time">{match.time} {match.timezone} · {match.venue}</div>

      {/* ── Transit pain ── */}
      {transit && (
        <div className="seattle-match-card__transit" style={{ borderColor: transit.color }}>
          <span className="transit-pain__label">Transit</span>
          <span className="transit-pain__score" style={{ color: transit.color }}>{transit.label}</span>
          <span className="transit-pain__peak">{transit.peakWindow}</span>
        </div>
      )}

      {/* ── Expand button ── */}
      <button
        className="seattle-match-card__expand-btn"
        onClick={() => setExpanded(v => !v)}
      >
        {expanded ? '▲ Less' : '▼ More details'}
      </button>

      {/* ── Expanded: weather + should I go + transit tips ── */}
      {expanded && (
        <div className="seattle-match-card__detail">
          <WeatherWidget matchDate={match.date} />

          {shouldIGo && (
            <div className="sigo-block">
              <div className="sigo-block__header">
                <span className="sigo-block__label">Should I Go?</span>
                <span className="sigo-block__score" style={{ color: SHOULD_GO_COLORS[shouldIGo.label] || 'var(--accent)' }}>
                  {shouldIGo.label} · {shouldIGo.score}/100
                </span>
              </div>
              <p className="sigo-block__summary">{shouldIGo.summary}</p>
            </div>
          )}

          {transit?.tips && (
            <div className="transit-tips">
              <div className="transit-tips__label">Transit tips</div>
              <ul>
                {transit.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="seattle-match-card__cal">
        <AddMatchToGoogleCalendar match={match} />
        <AddMatchToICS match={match} />
      </div>
    </div>
  );
}

export default function SeattleHQ() {
  const { venue, transit, fanZones, preGame } = seattleData;
  const { events } = eventsData;

  const lastUpdated = new Date(seattleData.lastUpdated).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div>
      <div className="dash-section-header">
        <h1 className="dash-section-title">Seattle HQ</h1>
        <span className="dash-last-updated">Updated {lastUpdated}</span>
      </div>

      {/* ── Match schedule ── */}
      <div className="dash-sub-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
          <h2 className="dash-sub-heading" style={{ marginBottom: 0 }}>Match Schedule — Lumen Field</h2>
          <AddAllToCalendar matches={seattleMatches} />
        </div>
        <p className="dash-sub-desc">6 matches · 4 group stage · 2 knockout</p>
        <div className="seattle-matches-grid">
          {seattleMatches.map(m => <MatchCard key={m.id} match={m} />)}
        </div>
      </div>

      {/* ── Venue & logistics ── */}
      <div className="dash-sub-section">
        <h2 className="dash-sub-heading">Matchday Logistics</h2>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-card__icon">🏟️</div>
            <div className="info-card__title">Venue</div>
            <div className="info-card__body">
              <strong>{venue.name}</strong><br />
              {venue.address}<br />
              <span className="info-card__note">Capacity: {venue.capacity.toLocaleString()} · {venue.notes}</span>
            </div>
          </div>
          <div className="info-card">
            <div className="info-card__icon">🚇</div>
            <div className="info-card__title">Transit</div>
            <div className="info-card__body">
              <strong>{transit.recommended}</strong>
              <ul className="info-list">
                {transit.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          </div>
          <div className="info-card">
            <div className="info-card__icon">🅿️</div>
            <div className="info-card__title">Parking & Rideshare</div>
            <div className="info-card__body">
              <strong>Parking:</strong> {venue.parkingNote}<br /><br />
              <strong>Rideshare:</strong> {transit.rideshare}
            </div>
          </div>
        </div>
      </div>

      {/* ── Fan zones & events ── */}
      <div className="dash-sub-section">
        <h2 className="dash-sub-heading">Fan Zones & Watch Parties</h2>
        <div className="events-list">
          {events.map(evt => (
            <div key={evt.id} className="event-card">
              <div className="event-card__top">
                <span className="event-card__type">{evt.type}</span>
                {!evt.confirmed && <span className="event-card__unconfirmed">TBC</span>}
                {evt.cost === 'Free' && <span className="event-card__free">Free</span>}
              </div>
              <div className="event-card__name">{evt.name}</div>
              <div className="event-card__location">📍 {evt.location}</div>
              <div className="event-card__dates">📅 {evt.dates} · {evt.hours}</div>
              {evt.notes && <div className="event-card__notes">{evt.notes}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Pre-game guide ── */}
      <div className="dash-sub-section">
        <h2 className="dash-sub-heading">Pre-Game & Food</h2>
        <div className="pregame-list">
          {preGame.map((spot, i) => (
            <div key={i} className="pregame-card">
              <div className="pregame-card__name">{spot.name}</div>
              <div className="pregame-card__type">{spot.type} · {spot.area}</div>
              <div className="pregame-card__distance">🚶 {spot.distance}</div>
              <div className="pregame-card__notes">{spot.notes}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Ticket watch ── */}
      <div className="dash-sub-section">
        <h2 className="dash-sub-heading">Ticket Watch</h2>
        <p className="dash-sub-desc">Seattle match inventory is limited. Monitor early.</p>
        <Link to="/dashboard/tickets" className="btn btn-primary" style={{ display: 'inline-flex' }}>
          Open Ticket Radar →
        </Link>
      </div>

      <p className="dash-disclaimer">
        Cup Radar is an independent fan-built dashboard and is not affiliated with FIFA.
        Official schedules, tickets, and venue information should be confirmed with official sources.
      </p>
    </div>
  );
}
