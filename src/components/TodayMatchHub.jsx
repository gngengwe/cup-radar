import { useEffect, useMemo, useRef, useState } from 'react';
import { useMatches } from '../hooks/useMatches';
import { matchKickoffISO } from '../utils/time';
import FlagImg from './FlagImg';
import JerseyDisplay from './JerseyDisplay';
import { getJersey } from '../utils/teamData';
import {
  fetchEspnScoreboard, matchEspnStatus, matchEspnEventId, fetchEspnSummary,
} from '../api/espnScoreboard';
import { normalizeEspnSoccerSummary } from '../utils/normalizeEspnSoccerSummary';
import { useMatchExcitement } from '../hooks/useMatchExcitement';
import { ExcitementMeter } from './ExcitementMeter';
import { MatchExcitementBadges } from './MatchExcitementBadges';
import { GoalLog } from './GoalLog';
import { ExcitementGraph } from './ExcitementGraph';
import WeatherWidget from './WeatherWidget';

function todayDateStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Returns true if a match should be in progress based on kickoff time,
// used as a fallback before ESPN data arrives on initial load.
function isProbablyLive(match) {
  if (match.status === 'finished') return false;
  const kickoff = new Date(matchKickoffISO(match)).getTime();
  const now = Date.now();
  return now >= kickoff && now <= kickoff + 150 * 60_000; // 150 min covers 90 + ET + pens
}

// ─── Live Match Hero ───────────────────────────────────────────────────────
function LiveHero({ match, espn, summary, probablyLive }) {
  const { excitement, badges } = useMatchExcitement(match, espn, summary);
  const isLive     = espn?.state === 'in' || (probablyLive && !espn);
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

      <WeatherWidget matchDate={match.date} city={match.city} time={match.time} timezone={match.timezone} compact />

      {(isLive || isFinished) && excitement && (
        <div className="lp-live-hero__meter">
          <ExcitementMeter excitement={excitement} />
        </div>
      )}
      {(isLive || isFinished) && <MatchExcitementBadges badges={badges} />}
      {isFinished && <ExcitementGraph match={match} summary={summary} />}
      {isFinished && <GoalLog match={match} />}
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

  // Merge ESPN's confirmed final score so buildFromScore works even when
  // local matches.json still shows status:'scheduled' / null scores
  const matchForGraph = isFinished
    ? { ...match, status: 'finished', homeScore: homeScore ?? 0, awayScore: awayScore ?? 0 }
    : match;

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
      {isFinished && <ExcitementGraph match={matchForGraph} summary={summary} height={44} />}
      {isFinished && <GoalLog match={match} />}

      <div className="lp-result-card__venue">{match.city}</div>
      <WeatherWidget matchDate={match.date} city={match.city} time={match.time} timezone={match.timezone} compact />
    </div>
  );
}

// ─── Upcoming Card ─────────────────────────────────────────────────────────
export function UpcomingCard({ match }) {
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
      <WeatherWidget matchDate={match.date} city={match.city} time={match.time} timezone={match.timezone} compact />
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

  const [espnByMatchId,    setEspnByMatchId]    = useState({});
  const [summaryByMatchId, setSummaryByMatchId] = useState({});
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

  const liveMatches = todayMatches.filter(m => {
    const s = espnByMatchId[m.id]?.state;
    if (s === 'in') return true;
    if (s === 'post') return false; // ESPN confirmed finished — don't promote
    return isProbablyLive(m);       // time-based guess before ESPN first responds
  });

  const finishedMatches = todayMatches
    .filter(m => {
      const s = espnByMatchId[m.id]?.state;
      if (liveMatches.includes(m)) return false;
      return s === 'post' || m.status === 'finished';
    })
    .sort((a, b) =>
      new Date(matchKickoffISO(b)).getTime() - new Date(matchKickoffISO(a)).getTime()
    );

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
            probablyLive={!espnByMatchId[m.id] && isProbablyLive(m)} />
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
