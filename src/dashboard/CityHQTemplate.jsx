// Shared HQ template — rendered by SeattleHQ and KansasCityHQ with city-specific data.
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AddAllToCalendar, AddMatchToGoogleCalendar, AddMatchToICS } from '../components/CalendarExport';
import WeatherWidget from '../components/WeatherWidget';
import FlagImg from '../components/FlagImg';
import { daysUntilLabel } from '../utils/time';
import ShareButton from '../components/ShareButton';
import JerseyDisplay from '../components/JerseyDisplay';
import { getJersey, getNickname } from '../utils/teamData';

const SHOULD_GO_COLORS = {
  'Once in a lifetime': '#00e676',
  'Don\'t miss it':     '#00e676',
  'Strongly Go':        '#00e676',
  'Go':                 'var(--accent)',
  'Consider':           '#ffb84d',
  'Wait':               'var(--text-muted)',
};

function MatchCard({ match, cityData }) {
  const [expanded, setExpanded] = useState(false);

  const d         = new Date(match.date + 'T12:00:00');
  const weekday   = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateStr   = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isKnockout = match.stage !== 'Group Stage';

  const transit   = cityData.transitPain?.find(t => t.matchId === match.id);
  const shouldIGo = cityData.shouldIGoScores?.find(s => s.matchId === match.id);

  const countdown = daysUntilLabel(match.date);

  return (
    <div className={`seattle-match-card${isKnockout ? ' knockout' : ''}${expanded ? ' expanded' : ''}${countdown === 'TODAY' || countdown === 'TOMORROW' ? ' imminent' : ''}`}>
      <div className="seattle-match-card__top">
        <span className="seattle-match-card__stage">{match.stage}</span>
        {isKnockout && <span className="seattle-match-card__badge">{match.stage === 'Quarterfinal' ? 'QF' : 'KO'}</span>}
        {countdown && (
          <span className={`seattle-match-card__countdown${countdown === 'TODAY' ? ' today' : countdown === 'TOMORROW' ? ' tomorrow' : ''}`}>
            {countdown}
          </span>
        )}
        {shouldIGo && (
          <span
            className="seattle-match-card__sigo"
            style={{ color: SHOULD_GO_COLORS[shouldIGo.label] || 'var(--accent)' }}
          >
            {shouldIGo.score}/100
          </span>
        )}
      </div>

      {/* ── Jersey matchup ── */}
      {(getJersey(match.homeCode) || getJersey(match.awayCode)) && (
        <div className="hq-jersey-matchup">
          <div className="hq-jersey-team">
            {getJersey(match.homeCode)
              ? <JerseyDisplay colors={getJersey(match.homeCode).colors} pattern={getJersey(match.homeCode).pattern} size={54} />
              : <FlagImg emoji={match.homeFlag} size={28} />}
            <span className="hq-jersey-team__name">{match.homeTeam}</span>
            {getNickname(match.homeCode) && <span className="hq-jersey-team__nick">"{getNickname(match.homeCode)}"</span>}
          </div>
          <span className="hq-jersey-vs">vs</span>
          <div className="hq-jersey-team">
            {getJersey(match.awayCode)
              ? <JerseyDisplay colors={getJersey(match.awayCode).colors} pattern={getJersey(match.awayCode).pattern} size={54} />
              : <FlagImg emoji={match.awayFlag} size={28} />}
            <span className="hq-jersey-team__name">{match.awayTeam}</span>
            {getNickname(match.awayCode) && <span className="hq-jersey-team__nick">"{getNickname(match.awayCode)}"</span>}
          </div>
        </div>
      )}

      <div className="seattle-match-card__date">{weekday}, {dateStr}</div>
      <div className="seattle-match-card__teams">
        <FlagImg emoji={match.homeFlag} size={14} /> {match.homeTeam}{' '}
        <span className="seattle-match-card__vs">vs</span>{' '}
        {match.awayTeam} <FlagImg emoji={match.awayFlag} size={14} />
      </div>
      <div className="seattle-match-card__time">{match.time} {match.timezone} · {match.venue}</div>

      {transit && (
        <div className="seattle-match-card__transit" style={{ borderColor: transit.color }}>
          <span className="transit-pain__label">Transit</span>
          <span className="transit-pain__score" style={{ color: transit.color }}>{transit.label}</span>
          <span className="transit-pain__peak">{transit.peakWindow}</span>
        </div>
      )}

      <button
        className="seattle-match-card__expand-btn"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        {expanded ? '▲ Less' : '▼ More details'}
      </button>

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
              <ul>{transit.tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      <div className="seattle-match-card__cal">
        <AddMatchToGoogleCalendar match={match} />
        <AddMatchToICS match={match} />
        <ShareButton
          text={`${match.homeTeam} vs ${match.awayTeam} — ${match.date} at ${match.venue}`}
          url={`https://wc.ngengwe.com`}
        />
      </div>
    </div>
  );
}

export default function CityHQTemplate({ cityData, matches, events, title, venueName }) {
  const { venue, transit, fanZones, preGame } = cityData;

  const lastUpdated = new Date(cityData.lastUpdated).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  // Merge fanZones from cityData with any additional events passed in
  const allFanZones = [...(fanZones || []), ...(events || [])];

  const knockoutCount = matches.filter(m => m.stage !== 'Group Stage').length;
  const groupCount    = matches.length - knockoutCount;

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">{title}</h2>
        <span className="dash-last-updated">Updated {lastUpdated}</span>
      </div>

      {/* ── Match schedule ── */}
      <div className="dash-sub-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 6 }}>
          <h3 className="dash-sub-heading" style={{ marginBottom: 0 }}>
            Match Schedule — {venueName || venue.name}
          </h3>
          <AddAllToCalendar matches={matches} />
        </div>
        <p className="dash-sub-desc">
          {matches.length} matches · {groupCount} group stage · {knockoutCount} knockout
        </p>
        <div className="seattle-matches-grid">
          {matches.map(m => <MatchCard key={m.id} match={m} cityData={cityData} />)}
        </div>
      </div>

      {/* ── Venue & logistics ── */}
      <div className="dash-sub-section">
        <h3 className="dash-sub-heading">Matchday Logistics</h3>
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
            <div className="info-card__icon">🚌</div>
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
      {allFanZones.length > 0 && (
        <div className="dash-sub-section">
          <h3 className="dash-sub-heading">Fan Zones & Watch Parties</h3>
          <div className="events-list">
            {allFanZones.map((evt, i) => (
              <div key={evt.id || i} className="event-card">
                <div className="event-card__top">
                  <span className="event-card__type">{evt.type}</span>
                  {!evt.confirmed && <span className="event-card__unconfirmed">TBC</span>}
                  {evt.cost === 'Free' || evt.free ? <span className="event-card__free">Free</span> : null}
                </div>
                <div className="event-card__name">{evt.name}</div>
                <div className="event-card__location">📍 {evt.location}</div>
                <div className="event-card__dates">📅 {evt.dates} · {evt.hours}</div>
                {evt.notes && <div className="event-card__notes">{evt.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pre-game guide ── */}
      {preGame?.length > 0 && (
        <div className="dash-sub-section">
          <h3 className="dash-sub-heading">Pre-Game & Food</h3>
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
      )}

      {/* ── Ticket watch ── */}
      <div className="dash-sub-section">
        <h3 className="dash-sub-heading">Ticket Watch</h3>
        <p className="dash-sub-desc">{cityData.cityName} match inventory is limited. Monitor early.</p>
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
