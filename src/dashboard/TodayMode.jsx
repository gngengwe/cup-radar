import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTodayMatches } from '../hooks/useMatches';
import alerts     from '../data/alerts.json';
import ticketData from '../data/tickets.json';
import matchData  from '../data/matches.json';
import FlagImg from '../components/FlagImg';
import { getCityMeta, isHomeMatch } from '../utils/cityConfig';

const KICKOFF = new Date('2026-06-11T00:00:00Z');
const FINAL   = new Date('2026-07-20T00:00:00Z');

function getPhase() {
  const now = new Date();
  if (now < KICKOFF) return 'pre';
  if (now > FINAL)   return 'post';
  return 'live';
}

function calcTimeLeft(target) {
  const diff = target - Date.now();
  if (diff <= 0) return null;
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000)    / 1_000),
  };
}

function pad(n) { return String(n).padStart(2, '0'); }

const CAT_COLORS = {
  tournament: 'var(--accent)',
  seattle:    '#4d8eff',
  tickets:    '#ffb84d',
  teams:      '#c084fc',
  travel:     '#34d399',
  culture:    '#f472b6',
};

export default function TodayMode() {
  const { city = 'seattle' } = useParams();
  const cityMeta = getCityMeta(city);
  const phase    = getPhase();
  const todayStr = new Date().toISOString().split('T')[0];

  const [t, setT] = useState(() => calcTimeLeft(KICKOFF));
  useEffect(() => {
    const id = setInterval(() => setT(calcTimeLeft(KICKOFF)), 1000);
    return () => clearInterval(id);
  }, []);

  // Today's matches — tries live API, falls back to local
  const { matches: todayMatches, source: matchSource } = useTodayMatches();

  const nextCityMatch = matchData.matches
    .filter(m => isHomeMatch(m, city) && m.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const topTicket = ticketData.tickets
    .filter(tk => tk.action === 'move')
    .sort((a, b) => b.opportunityScore - a.opportunityScore)[0];

  const lastUpdated = new Date(alerts.lastUpdated).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">Today Mode</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {matchSource === 'live' && <span className="data-source-badge live">● Live</span>}
          <span className="dash-last-updated">Updated {lastUpdated}</span>
        </div>
      </div>

      {/* ── Pre-tournament countdown ── */}
      {phase === 'pre' && t && (
        <div className="today-countdown-block">
          <p className="today-countdown-label">World Cup kicks off · June 11, 2026 · Mexico City</p>
          {/* aria-live="off" — seconds tick every second; announcing each change would spam screen readers.
              The static label above provides all needed context. */}
          <div className="today-countdown" role="timer" aria-label={`${t.days} days, ${t.hours} hours, ${t.minutes} minutes until kickoff`}>
            {[['days', t.days], ['hrs', t.hours], ['min', t.minutes], ['sec', t.seconds]].map(
              ([lbl, val], i, arr) => (
                <span key={lbl} className="today-countdown__unit-wrap">
                  <span className="today-countdown__num">{pad(val)}</span>
                  <span className="today-countdown__lbl">{lbl}</span>
                  {i < arr.length - 1 && <span className="today-countdown__sep">:</span>}
                </span>
              )
            )}
          </div>
          <p className="today-countdown-sub">Opening match: 🇲🇽 Mexico vs South Africa 🇿🇦</p>
        </div>
      )}

      {/* ── Live match list ── */}
      {phase === 'live' && (
        todayMatches.length > 0 ? (
          <div className="today-matches-block">
            <h3 className="today-sub-heading">Today's Matches</h3>
            <div className="today-matches-list">
              {todayMatches.map(m => {
                const homeToday = isHomeMatch(m, city);
                return (
                <div key={m.id} className={`today-match-card${homeToday ? ` ${city}` : ''}`}>
                  <div className="today-match-card__stage">
                    {m.stage} · {m.city}
                    {homeToday && <span className="match-row__city-tag" style={{marginLeft:8}}>{cityMeta.short}</span>}
                  </div>
                  <div className="today-match-card__teams">
                    <span><FlagImg emoji={m.homeFlag} size={16} /> {m.homeTeam}</span>
                    <span className="today-match-card__vs">
                      {m.status === 'live' || m.status === 'finished'
                        ? `${m.homeScore ?? '–'} – ${m.awayScore ?? '–'}`
                        : `${m.time} ${m.timezone}`}
                    </span>
                    <span>{m.awayTeam} <FlagImg emoji={m.awayFlag} size={16} /></span>
                  </div>
                  {m.status === 'live' && (
                    <div className="today-match-card__live" role="status" aria-live="polite" aria-atomic="true">
                      ● LIVE
                    </div>
                  )}
                  {m.status === 'finished' && <div className="today-match-card__ft">Full Time</div>}
                </div>
              );})}
            </div>
          </div>
        ) : (
          <div className="today-info-banner">
            No matches today. Check the <Link to={`/${city}/matches`}>Match Tracker</Link> for upcoming fixtures.
          </div>
        )
      )}

      {phase === 'post' && (
        <div className="today-info-banner">The 2026 World Cup has concluded. Thanks for following along.</div>
      )}

      {/* ── City alert (Seattle only for now — alerts.json has seattleAlert field) ── */}
      {city === 'seattle' && alerts.seattleAlert && (
        <div className="today-alert-card">
          <div className="today-alert-card__icon">{cityMeta.icon}</div>
          <div>
            <div className="today-alert-card__label">{cityMeta.label} Alert</div>
            <div className="today-alert-card__msg">{alerts.seattleAlert.message}</div>
            <div className="today-alert-card__meta">
              {alerts.seattleAlert.source} · {alerts.seattleAlert.date}
            </div>
          </div>
        </div>
      )}

      {/* ── Next city match ── */}
      {nextCityMatch && (
        <div className="today-next-seattle">
          <h3 className="today-sub-heading">Next {cityMeta.label} Match</h3>
          <div className="today-seattle-card">
            <div className="today-seattle-card__date">
              <span className="today-seattle-card__day">
                {new Date(nextCityMatch.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="today-seattle-card__datenum">
                {new Date(nextCityMatch.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="today-seattle-card__info">
              <div className="today-seattle-card__stage">{nextCityMatch.stage} · {nextCityMatch.notes}</div>
              <div className="today-seattle-card__teams">
                <FlagImg emoji={nextCityMatch.homeFlag} size={16} /> {nextCityMatch.homeTeam} vs {nextCityMatch.awayTeam} <FlagImg emoji={nextCityMatch.awayFlag} size={16} />
              </div>
              <div className="today-seattle-card__venue">
                ⏰ {nextCityMatch.time} {nextCityMatch.timezone} · {nextCityMatch.venue}
              </div>
            </div>
            <Link to={`/${city}/hq`} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              {cityMeta.label} HQ →
            </Link>
          </div>
        </div>
      )}

      {/* ── Top stories ── */}
      <div className="today-stories">
        <h3 className="today-sub-heading">Top Stories</h3>
        <div className="today-stories-list">
          {alerts.topStories.map((s, i) => (
            <div key={i} className="today-story">
              <span className="today-story__cat" style={{ color: CAT_COLORS[s.category] || 'var(--text-muted)' }}>
                {s.category}
              </span>
              <span className="today-story__headline">{s.headline}</span>
              <span className="today-story__date">{s.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top ticket opportunity ── */}
      {topTicket && (
        <div className="today-ticket-block">
          <h3 className="today-sub-heading">Top Ticket Opportunity</h3>
          <div className="today-ticket-card">
            <div className="today-ticket-card__tag move">MOVE</div>
            <div className="today-ticket-card__match">{topTicket.match}</div>
            <div className="today-ticket-card__meta">{topTicket.date} · {topTicket.city}</div>
            <div className="today-ticket-card__note">{topTicket.actionNote}</div>
            <div className="today-ticket-card__price">From {topTicket.observedResaleFrom}</div>
          </div>
          <Link to={`/${city}/tickets`} className="today-see-all">View all ticket opportunities →</Link>
        </div>
      )}

      {/* ── City energy ── */}
      <div className="today-energy-block">
        <h3 className="today-sub-heading">{cityMeta.label} City Energy</h3>
        <div className="today-energy">
          <div className="today-energy-bars">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className={`today-energy-bar${n <= alerts.cityEnergy ? ' active' : ''}`} />
            ))}
          </div>
          <span className="today-energy-score">{alerts.cityEnergy}/5</span>
          <span className="today-energy-label">
            {alerts.cityEnergy >= 4 ? 'Building fast' : alerts.cityEnergy >= 3 ? 'Warming up' : 'Early days'}
          </span>
        </div>
      </div>

      <p className="dash-disclaimer">
        Cup Radar is an independent fan-built dashboard and is not affiliated with FIFA.
        Official schedules, tickets, and venue information should be confirmed with official sources.
      </p>
    </div>
  );
}
