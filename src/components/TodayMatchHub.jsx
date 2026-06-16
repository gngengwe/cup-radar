import { useEffect, useMemo, useRef, useState } from 'react';
import { useMatches } from '../hooks/useMatches';
import FlagImg from './FlagImg';
import JerseyDisplay from './JerseyDisplay';
import { getJersey } from '../utils/teamData';
import {
  fetchEspnScoreboard, matchEspnStatus, matchEspnEventId, fetchEspnSummary,
} from '../api/espnScoreboard';
import { normalizeEspnSoccerSummary } from '../utils/normalizeEspnSoccerSummary';
import { computeMatchExcitement, parseClock } from '../utils/matchExcitementEngine';
import { useMatchExcitement } from '../hooks/useMatchExcitement';
import { ExcitementMeter } from './ExcitementMeter';
import { MatchExcitementBadges } from './MatchExcitementBadges';
import { GoalLog } from './GoalLog';
import { ExcitementGraph } from './ExcitementGraph';

function todayDateStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const CITY_HQ_LINKS = {
  seattleMatch:   '/seattle/hq',
  kcMatch:        '/kansascity/hq',
  miamiMatch:     '/miami/hq',
  nyMatch:        '/newyork/hq',
  phillyMatch:    '/philly/hq',
  atlantaMatch:   '/atlanta/hq',
  vancouverMatch: '/vancouver/hq',
};

function matchHQLink(match) {
  for (const [flag, url] of Object.entries(CITY_HQ_LINKS)) {
    if (match[flag]) return url;
  }
  return '/matches';
}

// ─── Live Match Hero ───────────────────────────────────────────────────────
function LiveHero({ match, espn, summary, livePoints }) {
  const { excitement, badges } = useMatchExcitement(match, espn, summary);
  const isLive     = espn?.state === 'in';
  const isFinished = espn?.state === 'post' || match.status === 'finished';
  const homeScore  = espn?.homeScore ?? match.homeScore;
  const awayScore  = espn?.awayScore ?? match.awayScore;
  const hasJerseys = getJersey(match.homeCode) && getJersey(match.awayCode);

  const stageLabel = match.stage === 'Group Stage' && match.group
    ? `Group ${match.group}`
    : match.stage;

  return (
    <div className={`lp-live-hero${isLive ? ' is-live' : ''}`}>
      <div className="lp-live-hero__topbar">
        {isLive     && <span className="lp-live-hero__pill is-live">🔴 Live</span>}
        {isFinished && <span className="lp-live-hero__pill is-done">Full Time</span>}
        <span className="lp-live-hero__context">
          {stageLabel}
          {isLive && espn?.clock && <> · <strong>{espn.clock}</strong></>}
        </span>
      </div>

      <div className="lp-live-hero__scoreboard">
        <div className="lp-live-hero__team">
          {hasJerseys
            ? <JerseyDisplay colors={getJersey(match.homeCode).colors} pattern={getJersey(match.homeCode).pattern} size={64} />
            : <FlagImg emoji={match.homeFlag} size={48} />}
          <span className="lp-live-hero__team-name">{match.homeTeam}</span>
        </div>

        <div className="lp-live-hero__score">
          {(isLive || isFinished)
            ? <><span>{homeScore}</span><span className="lp-live-hero__sep">–</span><span>{awayScore}</span></>
            : <span className="lp-live-hero__vs">vs</span>}
        </div>

        <div className="lp-live-hero__team">
          {hasJerseys
            ? <JerseyDisplay colors={getJersey(match.awayCode).colors} pattern={getJersey(match.awayCode).pattern} size={64} />
            : <FlagImg emoji={match.awayFlag} size={48} />}
          <span className="lp-live-hero__team-name">{match.awayTeam}</span>
        </div>
      </div>

      <div className="lp-live-hero__venue">
        {match.venue} · {match.city} · {match.time} {match.timezone}
      </div>

      {(isLive || isFinished) && excitement && (
        <div className="lp-live-hero__meter">
          <ExcitementMeter excitement={excitement} />
        </div>
      )}
      {(isLive || isFinished) && <MatchExcitementBadges badges={badges} />}
      {(isLive || isFinished) && (
        <ExcitementGraph match={match} summary={summary}
          livePoints={isLive ? (livePoints || []) : undefined} />
      )}
      {isFinished && <GoalLog match={match} />}

      {isLive && (
        <a href={matchHQLink(match)} className="btn btn-primary lp-live-hero__cta">
          Open City HQ →
        </a>
      )}
    </div>
  );
}

// ─── Completed Match Card ──────────────────────────────────────────────────
function ResultCard({ match, espn, summary }) {
  const { badges } = useMatchExcitement(match, espn, summary);
  const isFinished = espn?.state === 'post' || match.status === 'finished';
  const isLive     = espn?.state === 'in';
  const homeScore  = espn?.homeScore ?? match.homeScore;
  const awayScore  = espn?.awayScore ?? match.awayScore;

  return (
    <div className={`lp-result-card${isLive ? ' is-live' : ''}`}>
      <div className="lp-result-card__status">
        {isFinished ? 'FT' : isLive ? `🔴 ${espn.clock}` : `${match.time} ${match.timezone}`}
        {match.group && <span className="lp-result-card__group"> · Group {match.group}</span>}
      </div>

      <div className="lp-result-card__scoreline">
        <div className="lp-result-card__side">
          <FlagImg emoji={match.homeFlag} size={18} />
          <span>{match.homeTeam}</span>
        </div>
        <div className="lp-result-card__score">
          {(isFinished || isLive) ? `${homeScore} – ${awayScore}` : 'vs'}
        </div>
        <div className="lp-result-card__side lp-result-card__side--away">
          <span>{match.awayTeam}</span>
          <FlagImg emoji={match.awayFlag} size={18} />
        </div>
      </div>

      {(isFinished || isLive) && <MatchExcitementBadges badges={badges} />}
      {isFinished && <ExcitementGraph match={match} summary={summary} height={44} />}
      {isFinished && <GoalLog match={match} />}

      <div className="lp-result-card__venue">{match.city}</div>
    </div>
  );
}

// ─── Upcoming Card ─────────────────────────────────────────────────────────
function UpcomingCard({ match }) {
  return (
    <div className="lp-upcoming-card">
      <div className="lp-upcoming-card__time">
        {match.time} <span className="lp-upcoming-card__tz">{match.timezone}</span>
      </div>
      <div className="lp-upcoming-card__matchup">
        <FlagImg emoji={match.homeFlag} size={16} />
        <span>{match.homeTeam}</span>
        <span className="lp-upcoming-card__vs">vs</span>
        <span>{match.awayTeam}</span>
        <FlagImg emoji={match.awayFlag} size={16} />
      </div>
      <div className="lp-upcoming-card__meta">
        {match.group ? `Group ${match.group}` : match.stage} · {match.city}
      </div>
    </div>
  );
}

// ─── Main Section ──────────────────────────────────────────────────────────
export default function TodayMatchHub() {
  const { matches } = useMatches();
  const todayStr    = useMemo(todayDateStr, []);

  const todayMatches = useMemo(
    () => matches.filter(m => m.date === todayStr),
    [matches, todayStr],
  );

  const [espnByMatchId,      setEspnByMatchId]      = useState({});
  const [summaryByMatchId,   setSummaryByMatchId]    = useState({});
  const [liveGraphByMatchId, setLiveGraphByMatchId]  = useState({});
  const summaryFetchedRef = useRef(new Set());

  useEffect(() => {
    if (!todayMatches.length) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const events = await fetchEspnScoreboard(todayStr);
        if (cancelled) return;
        const next = {};
        for (const m of todayMatches) next[m.id] = matchEspnStatus(events, m);
        setEspnByMatchId(next);

        for (const m of todayMatches.filter(m => next[m.id]?.state === 'in')) {
          const espn = next[m.id];
          let newSummary = summaryByMatchId[m.id];

          const eventId = matchEspnEventId(events, m);
          if (eventId) {
            try {
              const sum = await fetchEspnSummary(eventId);
              if (cancelled) return;
              newSummary = normalizeEspnSoccerSummary(sum, m);
              setSummaryByMatchId(prev => ({ ...prev, [m.id]: newSummary }));
            } catch { /* fall back to static signals */ }
          }

          const { minute } = parseClock(espn?.clock);
          if (minute != null) {
            const { score } = computeMatchExcitement(m, espn, [], newSummary || {});
            setLiveGraphByMatchId(prev => ({
              ...prev,
              [m.id]: [...(prev[m.id] || []).slice(-200), { minute, score }],
            }));
          }
        }

        // Fetch summary once for finished matches (gives scoreTimeline for graph
        // before bot commits goal data to matches.json)
        const newlyFinished = todayMatches.filter(m =>
          next[m.id]?.state === 'post' && !summaryFetchedRef.current.has(m.id)
        );
        for (const m of newlyFinished) {
          summaryFetchedRef.current.add(m.id);
          const eventId = matchEspnEventId(events, m);
          if (!eventId) continue;
          try {
            const sum = await fetchEspnSummary(eventId);
            if (cancelled) return;
            setSummaryByMatchId(prev => ({ ...prev, [m.id]: normalizeEspnSoccerSummary(sum, m) }));
          } catch { /* fail soft */ }
        }
      } catch { /* fail soft */ }
    };

    tick();
    const id = setInterval(tick, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [todayStr, todayMatches]);

  if (!todayMatches.length) return null;

  const liveMatches = todayMatches.filter(m =>
    espnByMatchId[m.id]?.state === 'in' || m.status === 'live',
  );

  const finishedMatches = todayMatches
    .filter(m => {
      const s = espnByMatchId[m.id]?.state;
      if (liveMatches.includes(m)) return false;
      return s === 'post' || m.status === 'finished';
    })
    .sort((a, b) => b.time.localeCompare(a.time)); // most recent kickoff first

  const upcomingMatches = todayMatches
    .filter(m => !liveMatches.includes(m) && !finishedMatches.includes(m))
    .sort((a, b) => a.time.localeCompare(b.time));

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const hasActivePlay = liveMatches.length > 0 || finishedMatches.length > 0;

  return (
    <section className="lp-today">
      <div className="container">
        <div className="lp-today__header">
          <span className="section-label">Match Day</span>
          <h2 className="lp-today__heading">Today&apos;s Action</h2>
          <p className="lp-today__date">{dateLabel}</p>
        </div>

        {liveMatches.map(m => (
          <LiveHero key={m.id} match={m} espn={espnByMatchId[m.id]} summary={summaryByMatchId[m.id]}
            livePoints={liveGraphByMatchId[m.id]} />
        ))}

        {finishedMatches.length > 0 && (
          <div className="lp-today__block">
            {liveMatches.length > 0 && (
              <div className="lp-today__sublabel">Today&apos;s Results</div>
            )}
            <div className="lp-today__results-grid">
              {finishedMatches.map(m => (
                <ResultCard key={m.id} match={m} espn={espnByMatchId[m.id]} summary={summaryByMatchId[m.id]} />
              ))}
            </div>
          </div>
        )}

        {upcomingMatches.length > 0 && (
          <div className="lp-today__block">
            {hasActivePlay && <div className="lp-today__sublabel">Coming Up Today</div>}
            <div className="lp-today__upcoming-grid">
              {upcomingMatches.map(m => (
                <UpcomingCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
