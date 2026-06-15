// Shared HQ template — rendered by SeattleHQ, KansasCityHQ, MiamiHQ, NewYorkHQ, PhillyHQ.
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import alertsData from '../data/alerts.json';
import { AddAllToCalendar, AddMatchToGoogleCalendar, AddMatchToICS } from '../components/CalendarExport';
import WeatherWidget from '../components/WeatherWidget';
import FlagImg from '../components/FlagImg';
import { daysUntilLabel, matchKickoffISO, liveCountdown } from '../utils/time';
import { fetchEspnScoreboard, matchEspnStatus, matchEspnEventId, fetchEspnSummary } from '../api/espnScoreboard';
import { normalizeEspnSoccerSummary } from '../utils/normalizeEspnSoccerSummary';
import { useMatchExcitement } from '../hooks/useMatchExcitement';
import { ExcitementMeter } from '../components/ExcitementMeter';
import { MatchExcitementBadges } from '../components/MatchExcitementBadges';
import { GoalLog } from '../components/GoalLog';
import ShareButton from '../components/ShareButton';
import JerseyDisplay from '../components/JerseyDisplay';
import { getJersey, getNickname } from '../utils/teamData';
import CurrencyWidget from '../components/CurrencyWidget';

const PULSE_ACTION = {
  move:  { label: 'MOVE',  bg: 'var(--accent)',          color: '#041208'           },
  watch: { label: 'WATCH', bg: 'var(--blue-soft)',        color: '#4d8eff'           },
  wait:  { label: 'WAIT',  bg: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' },
};

const SHOULD_GO_COLORS = {
  'Once in a lifetime': '#00e676',
  'Don\'t miss it':     '#00e676',
  'Strongly Go':        '#00e676',
  'Go':                 'var(--accent)',
  'Consider':           '#ffb84d',
  'Wait':               'var(--text-muted)',
};

function MatchCard({ match, cityData, cityId = 'seattle' }) {
  const [expanded, setExpanded] = useState(false);

  const d         = new Date(match.date + 'T12:00:00');
  const weekday   = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateStr   = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isKnockout = match.stage !== 'Group Stage';

  const transit   = cityData.transitPain?.find(t => t.matchId === match.id);
  const shouldIGo = cityData.shouldIGoScores?.find(s => s.matchId === match.id);

  const countdown = daysUntilLabel(match.date);
  const isMatchDay = countdown === 'TODAY';

  return (
    <div className={`hq-match-card${isKnockout ? ' knockout' : ''}${expanded ? ' expanded' : ''}${countdown === 'TODAY' || countdown === 'TOMORROW' ? ' imminent' : ''}`}>
      <div className="hq-match-card__top">
        <span className="hq-match-card__stage">{match.stage}</span>
        {isKnockout && <span className="hq-match-card__badge">{match.stage === 'Quarterfinal' ? 'QF' : 'KO'}</span>}
        {countdown && (
          <span className={`hq-match-card__countdown${countdown === 'TODAY' ? ' today' : countdown === 'TOMORROW' ? ' tomorrow' : ''}`}>
            {countdown}
          </span>
        )}
        {!isMatchDay && shouldIGo && (
          <span
            className="hq-match-card__sigo"
            style={{ color: SHOULD_GO_COLORS[shouldIGo.label] || 'var(--accent)' }}
          >
            {shouldIGo.score}/100
          </span>
        )}
      </div>

      {/* ── Jersey matchup ── */}
      {(getJersey(match.homeCode) && getJersey(match.awayCode)) && (
        <div className="hq-jersey-matchup">
          <div className="hq-jersey-team">
            <JerseyDisplay colors={getJersey(match.homeCode).colors} pattern={getJersey(match.homeCode).pattern} size={54} />
            <span className="hq-jersey-team__name">{match.homeTeam}</span>
          </div>
          <span className="hq-jersey-vs">vs</span>
          <div className="hq-jersey-team">
            <JerseyDisplay colors={getJersey(match.awayCode).colors} pattern={getJersey(match.awayCode).pattern} size={54} />
            <span className="hq-jersey-team__name">{match.awayTeam}</span>
          </div>
        </div>
      )}

      <div className="hq-match-card__date">{weekday}, {dateStr}</div>
      <div className="hq-match-card__teams">
        <FlagImg emoji={match.homeFlag} size={14} /> {match.homeTeam}{' '}
        <span className="hq-match-card__vs">vs</span>{' '}
        {match.awayTeam} <FlagImg emoji={match.awayFlag} size={14} />
      </div>
      <div className="hq-match-card__time">{match.time} {match.timezone} · {match.venue}</div>

      {transit && (
        <div className="hq-match-card__transit" style={{ borderColor: transit.color }}>
          <span className="transit-pain__label">Transit</span>
          <span className="transit-pain__score" style={{ color: transit.color }}>{transit.label}</span>
          <span className="transit-pain__peak">{transit.peakWindow}</span>
        </div>
      )}

      <button
        className="hq-match-card__expand-btn"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        {expanded ? '▲ Less' : '▼ More details'}
      </button>

      {expanded && (
        <div className="hq-match-card__detail">
          {!isMatchDay && <WeatherWidget matchDate={match.date} cityId={cityId} />}

          {!isMatchDay && shouldIGo && (
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

      <div className="hq-match-card__cal">
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

function MatchDayHero({ match, cityData }) {
  const [now, setNow] = useState(Date.now());
  const [espn, setEspn] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      setNow(Date.now());
      try {
        const events = await fetchEspnScoreboard(match.date);
        if (cancelled) return;
        const status = matchEspnStatus(events, match);
        setEspn(status);

        // V2 storyline data — only fetch for live matches (30s cadence)
        if (status?.state === 'in') {
          const eventId = matchEspnEventId(events, match);
          if (eventId) {
            try {
              const rawSummary = await fetchEspnSummary(eventId);
              if (!cancelled) setSummary(normalizeEspnSoccerSummary(rawSummary, match));
            } catch {
              // fail soft — excitement/badges fall back to MVP-only signals
            }
          }
        }
      } catch {
        // fail soft — hero falls back to local match.status
      }
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [match.id]);

  const energyEntry = cityData.cityEnergyForecast?.find(e => e.matchId === match.id);
  const transit      = cityData.transitPain?.find(t => t.matchId === match.id);
  const countdown    = liveCountdown(matchKickoffISO(match));
  const isLive       = espn?.state === 'in';
  const isFinished   = espn?.state === 'post' || match.status === 'finished';
  const { excitement, badges } = useMatchExcitement(match, espn, summary);

  let status;
  if (espn?.state === 'post') {
    status = `FINAL · ${match.homeTeam} ${espn.homeScore}–${espn.awayScore} ${match.awayTeam}`;
  } else if (isLive) {
    status = `🔴 LIVE ${espn.clock} · ${match.homeTeam} ${espn.homeScore}–${espn.awayScore} ${match.awayTeam}`;
  } else if (match.status === 'finished') {
    status = `FINAL · ${match.homeTeam} ${match.homeScore}–${match.awayScore} ${match.awayTeam}`;
  } else if (countdown) {
    status = `Kicks off in ${countdown}`;
  } else {
    status = '🔴 Live now — check back for the score';
  }

  return (
    <div className="hq-matchday-hero">
      <div className="hq-matchday-hero__pill">🔴 Match Day</div>
      <div className="hq-matchday-hero__matchup">
        {(getJersey(match.homeCode) && getJersey(match.awayCode)) ? (
          <>
            <div className="hq-jersey-team">
              <JerseyDisplay colors={getJersey(match.homeCode).colors} pattern={getJersey(match.homeCode).pattern} size={64} />
              <span className="hq-jersey-team__name">{match.homeTeam}</span>
            </div>
            <span className="hq-jersey-vs">vs</span>
            <div className="hq-jersey-team">
              <JerseyDisplay colors={getJersey(match.awayCode).colors} pattern={getJersey(match.awayCode).pattern} size={64} />
              <span className="hq-jersey-team__name">{match.awayTeam}</span>
            </div>
          </>
        ) : (
          <>
            <FlagImg emoji={match.homeFlag} size={28} />
            <strong>{match.homeTeam}</strong>
            <span className="hq-jersey-vs">vs</span>
            <strong>{match.awayTeam}</strong>
            <FlagImg emoji={match.awayFlag} size={28} />
          </>
        )}
      </div>
      <div className="hq-matchday-hero__status">{status}</div>
      {((isLive && excitement) || (isFinished && badges.dominant)) && (
        <div className="hq-matchday-hero__excitement">
          {isLive && excitement && <ExcitementMeter excitement={excitement} />}
          <MatchExcitementBadges badges={badges} />
        </div>
      )}
      {isFinished && <GoalLog match={match} />}
      <div className="hq-matchday-hero__meta">
        {match.time} {match.timezone} · {match.venue}
        {energyEntry && (
          <span className="city-today-banner__energy" title={energyEntry.crowdNote}>
            · {'⚡'.repeat(Math.min(energyEntry.energyScore, 5))}
          </span>
        )}
      </div>
      {transit && (
        <div className="hq-match-card__transit hq-matchday-hero__transit" style={{ borderColor: transit.color }}>
          <span className="transit-pain__label">Transit</span>
          <span className="transit-pain__score" style={{ color: transit.color }}>{transit.label}</span>
          <span className="transit-pain__peak">{transit.peakWindow}</span>
        </div>
      )}
    </div>
  );
}

function UpcomingBanner({ match }) {
  const cd = daysUntilLabel(match.date);

  return (
    <div className="city-today-banner">
      <div className="city-today-banner__pill">{cd || 'Upcoming'}</div>
      <div className="city-today-banner__match">
        <FlagImg emoji={match.homeFlag} size={15} />
        <strong>{match.homeTeam}</strong>
        <span style={{ color: 'var(--text-dim)', margin: '0 6px' }}>vs</span>
        <strong>{match.awayTeam}</strong>
        <FlagImg emoji={match.awayFlag} size={15} />
      </div>
      <div className="city-today-banner__meta">
        {match.time} {match.timezone} · {match.venue}
      </div>
    </div>
  );
}

function TodaySummary({ matches, cityData }) {
  const today      = new Date().toISOString().split('T')[0];
  const todayMatch = matches.find(m => m.date === today);
  const nextMatch  = matches
    .filter(m => m.date > today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const featured   = todayMatch || nextMatch;
  if (!featured) return null;

  return todayMatch
    ? <MatchDayHero match={featured} cityData={cityData} />
    : <UpcomingBanner match={featured} />;
}

export default function CityHQTemplate({ cityData, matches, events, title, venueName, cityId = 'seattle' }) {
  const { venue, transit, fanZones, preGame } = cityData;
  const pulse      = alertsData.ticketPulse?.[cityId];
  const pulseCfg   = PULSE_ACTION[pulse?.action] || PULSE_ACTION.watch;

  const lastUpdated = new Date(cityData.lastUpdated).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  // Merge fanZones from cityData with any additional events passed in
  const allFanZones = [...(fanZones || []), ...(events || [])];

  const knockoutCount = matches.filter(m => m.stage !== 'Group Stage').length;
  const groupCount    = matches.length - knockoutCount;

  const teamCodes = [...new Set(matches.flatMap(m => [m.homeCode, m.awayCode]).filter(Boolean))];

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">{title}</h2>
        <span className="dash-last-updated">Updated {lastUpdated}</span>
      </div>

      {/* ── Today/Next match summary ── */}
      <TodaySummary matches={matches} cityData={cityData} />

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
        <div className="hq-matches-grid">
          {matches.map(m => <MatchCard key={m.id} match={m} cityData={cityData} cityId={cityId} />)}
        </div>
      </div>

      {/* ── Currency exchange ── */}
      <div className="dash-sub-section">
        <CurrencyWidget teamCodes={teamCodes} />
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
              <p style={{ margin: '0 0 8px' }}><strong>Parking:</strong> {venue.parkingNote}</p>
              <p style={{ margin: 0 }}><strong>Rideshare:</strong> {transit.rideshare}</p>
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

      {/* ── Ticket pulse ── */}
      <div className="dash-sub-section">
        <h3 className="dash-sub-heading">Ticket Pulse</h3>
        {pulse ? (
          <div className="hq-pulse-inline">
            <div className="hq-pulse-inline__top">
              <span className="ticket-pulse-action" style={{ background: pulseCfg.bg, color: pulseCfg.color }}>
                {pulseCfg.label}
              </span>
              <span className="hq-pulse-inline__note">{pulse.note}</span>
            </div>
            <div className="hq-pulse-inline__ctas">
              <a href="https://www.fifa.com/tickets" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                Official tickets at FIFA ↗
              </a>
              <Link to={`/${cityId}/tickets`} className="btn btn-secondary" style={{ display: 'inline-flex' }}>
                Full ticket guide
              </Link>
            </div>
          </div>
        ) : (
          <p className="dash-sub-desc">
            Ticket intelligence coming soon.{' '}
            <a href="https://www.fifa.com/tickets" target="_blank" rel="noopener noreferrer">Official tickets at FIFA ↗</a>
          </p>
        )}
      </div>

      <p className="dash-disclaimer">
        Cup Radar is an independent fan-built dashboard and is not affiliated with FIFA.
        Official schedules, tickets, and venue information should be confirmed with official sources.
      </p>
    </div>
  );
}
