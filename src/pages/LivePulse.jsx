import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMatches } from '../hooks/useMatches';
import {
  fetchEspnScoreboard, matchEspnStatus, matchEspnEventId, fetchEspnSummary,
} from '../api/espnScoreboard';
import { normalizeEspnSoccerSummary } from '../utils/normalizeEspnSoccerSummary';
import { computeMatchExcitement } from '../utils/matchExcitementEngine';
import FlagImg from '../components/FlagImg';

// ─── Utilities ────────────────────────────────────────────────────────────────

function makeTodayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 15)   return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function pct(v) { return v != null ? `${Math.round(v * 100)}%` : '—'; }

// ─── Notification derivation ──────────────────────────────────────────────────
//
// Three layers:
//   1. Beat cards    — state transitions (kick-off, 2nd half, FT) — guaranteed
//   2. Explain It    — first time a stat type appears, teaching what it means
//   3. Tension cards — excitement band crossings late in the match
//
// All delay-safe: driven by cumulative stats and ESPN state, never by events.

const BAND_COOLDOWN_MS = 3 * 60_000;

function deriveNotifs(match, espn, summary, ex, guard) {
  const out    = [];
  const isLive = espn?.state === 'in';
  const isPost = espn?.state === 'post';
  const stats  = summary?.stats;
  const hs     = espn?.homeScore ?? 0;
  const as_    = espn?.awayScore ?? 0;
  const period = espn?.period ?? 0;

  // ── LAYER 1: BEAT CARDS (guaranteed) ─────────────────────────────────────

  // Kick-off
  if (isLive && guard.prevEspnState !== 'in' && !guard.firedStatKeys.has('kickoff')) {
    guard.firedStatKeys.add('kickoff');
    const stageCtx = match.group
      ? `Group ${match.group} match — 3 points for a win, 1 for a draw`
      : match.stage || 'Knockout round';
    out.push({
      id: `${match.id}-kickoff`,
      type: 'teach', priority: 3, icon: '⚽',
      title: `Underway: ${match.homeTeam} vs ${match.awayTeam}`,
      subtext: `${stageCtx}. Watch who controls the ball in the first 10 minutes — the team that sets the tempo early often dictates the whole match.`,
      match, firedAt: Date.now(),
    });
  }

  // Second half — fires when ESPN confirms period 2
  if (isLive && period >= 2 && (guard.prevPeriod ?? 0) < 2 && !guard.firedStatKeys.has('second-half')) {
    guard.firedStatKeys.add('second-half');

    let htStat = '';
    if (stats) {
      const totalShots = (stats.homeShots || 0) + (stats.awayShots || 0);
      const homePoss   = stats.homePossession || 0;
      const awayPoss   = stats.awayPossession || 0;
      const who        = homePoss >= awayPoss ? match.homeTeam : match.awayTeam;
      const howMuch    = Math.max(homePoss, awayPoss);
      htStat = howMuch > 0
        ? `${who} had ${howMuch}% of the ball and there were ${totalShots} shots total. `
        : `${totalShots} shots in the first half. `;
    }

    const scoreCtx = hs === as_
      ? `Still ${hs}–${as_} — 45 minutes to break the deadlock.`
      : `${hs > as_ ? match.homeTeam : match.awayTeam} lead ${Math.max(hs, as_)}–${Math.min(hs, as_)}. The trailing team will push forward — and leave space at the back.`;

    out.push({
      id: `${match.id}-second-half`,
      type: 'teach', priority: 3, icon: '🔄',
      title: `Second half — here's the story so far`,
      subtext: `${htStat}${scoreCtx}`,
      match, firedAt: Date.now(),
    });
  }

  // Full time
  if (isPost && !guard.firedPost) {
    guard.firedPost = true;
    let shotLine = '';
    if (stats) {
      const total = (stats.homeShots || 0) + (stats.awayShots || 0);
      shotLine = ` ${total} combined shots across 90 minutes.`;
    }
    const resultLine = hs === as_
      ? `Both teams take 1 point.`
      : `${hs > as_ ? match.homeTeam : match.awayTeam} take all 3 points.`;
    out.push({
      id: `${match.id}-post`,
      type: 'post', priority: 5, icon: '🏁',
      title: `Full time: ${match.homeTeam} ${hs}–${as_} ${match.awayTeam}`,
      subtext: `${resultLine}${shotLine}`,
      match, firedAt: Date.now(),
    });
  }

  // ── LAYER 2: EXPLAIN IT CARDS (one-shot per stat type) ───────────────────

  if (isLive && stats) {
    const homeShots    = stats.homeShots    || 0;
    const awayShots    = stats.awayShots    || 0;
    const totalShots   = homeShots + awayShots;
    const totalGoals   = hs + as_;
    const totalYellow  = (stats.homeYellow  || 0) + (stats.awayYellow  || 0);
    const totalFouls   = (stats.homeFouls   || 0) + (stats.awayFouls   || 0);
    const totalCorners = (stats.homeCorners || 0) + (stats.awayCorners || 0);
    const homePoss     = stats.homePossession || 0;
    const awayPoss     = stats.awayPossession || 0;

    // Possession — fires as soon as ESPN has possession data
    if ((homePoss > 0 || awayPoss > 0) && !guard.firedStatKeys.has('possession-intro')) {
      guard.firedStatKeys.add('possession-intro');
      const who   = homePoss >= awayPoss ? match.homeTeam : match.awayTeam;
      const other = homePoss >= awayPoss ? match.awayTeam : match.homeTeam;
      const val   = Math.max(homePoss, awayPoss);
      out.push({
        id: `${match.id}-possession-intro`,
        type: 'teach', priority: 2, icon: '📊',
        title: `${who} with ${val}% possession`,
        subtext: `Possession = how much each team has had the ball. High possession can mean control — or it can mean ${other} is sitting deep and waiting to counter-attack. Watch the shots column to see which story this becomes.`,
        match, firedAt: Date.now(),
      });
    }

    // Corner kick — fires on first corner
    if (totalCorners >= 1 && !guard.firedStatKeys.has('corner-intro')) {
      guard.firedStatKeys.add('corner-intro');
      out.push({
        id: `${match.id}-corner-intro`,
        type: 'teach', priority: 2, icon: '🚩',
        title: `First corner kick of the match`,
        subtext: `A corner happens when a defender puts the ball over their own goal line. The attacking team gets a free kick from the corner flag — a prime chance for a headed goal. About 1 in 10 World Cup goals comes from a corner situation.`,
        match, firedAt: Date.now(),
      });
    }

    // Yellow card — fires on first yellow
    if (totalYellow >= 1 && !guard.firedStatKeys.has('yellow-intro')) {
      guard.firedStatKeys.add('yellow-intro');
      out.push({
        id: `${match.id}-yellow-intro`,
        type: 'teach', priority: 2, icon: '🟨',
        title: `First yellow card`,
        subtext: `A yellow is a formal warning from the referee. Two yellows in one game = sent off (10 vs 11 for the rest of the match). Two yellows across different games in the tournament = suspended next match — teams in the knockouts protect key players carefully.`,
        match, firedAt: Date.now(),
      });
    }

    // Shot drought — fires when 5+ shots with no goals
    if (totalShots >= 5 && totalGoals === 0 && !guard.firedStatKeys.has('shot-drought')) {
      guard.firedStatKeys.add('shot-drought');
      out.push({
        id: `${match.id}-shot-drought`,
        type: 'teach', priority: 2, icon: '🧤',
        title: `${totalShots} shots — both keepers holding firm`,
        subtext: `Most shots in soccer don't score. A keeper saves around 70% of shots on target, and many shots miss entirely. The World Cup average is about 2–3 goals per game across 90 minutes — patience is a weapon.`,
        match, firedAt: Date.now(),
      });
    }

    // Counter-attack — fires when one team dominates possession but the other has equal/more shots
    if (!guard.firedStatKeys.has('counter-attack')) {
      const homeCountering = awayPoss >= 60 && homeShots >= awayShots && totalShots >= 4;
      const awayCountering = homePoss >= 60 && awayShots >= homeShots && totalShots >= 4;
      if (homeCountering || awayCountering) {
        guard.firedStatKeys.add('counter-attack');
        const counter  = homeCountering ? match.homeTeam : match.awayTeam;
        const dominant = homeCountering ? match.awayTeam : match.homeTeam;
        const domPoss  = homeCountering ? awayPoss : homePoss;
        out.push({
          id: `${match.id}-counter-attack`,
          type: 'teach', priority: 2, icon: '⚡',
          title: `${counter} counter-attacking with less of the ball`,
          subtext: `${dominant} has ${domPoss}% possession but ${counter} has the same or more shots. Classic counter-attack: sit deep, defend in numbers, then explode forward the moment you win the ball back. High risk, potentially lethal.`,
          match, firedAt: Date.now(),
        });
      }
    }

    // Physical match — fires at 8+ total fouls
    if (totalFouls >= 8 && !guard.firedStatKeys.has('physical')) {
      guard.firedStatKeys.add('physical');
      out.push({
        id: `${match.id}-physical`,
        type: 'teach', priority: 2, icon: '💪',
        title: `${totalFouls} fouls — this one's getting physical`,
        subtext: `A foul stops play and gives the other team a free kick. Near the penalty box, that's nearly as dangerous as a corner. When fouls pile up it usually means one team is winning the physical battle — or getting desperate.`,
        match, firedAt: Date.now(),
      });
    }

    // Second yellow wave — fires at 4+ yellows (follow-up to yellow-intro)
    if (totalYellow >= 4 && !guard.firedStatKeys.has('yellow-wave')) {
      guard.firedStatKeys.add('yellow-wave');
      out.push({
        id: `${match.id}-yellow-wave`,
        type: 'teach', priority: 2, icon: '🟨',
        title: `${totalYellow} yellow cards — players on the edge`,
        subtext: `With this many yellows, some players are one foul away from a red card. Teams often make tactical substitutions to take a booked player off before they get sent off — protecting a man advantage for the rest of the match.`,
        match, firedAt: Date.now(),
      });
    }
  }

  // ── LAYER 3: TENSION CARDS (excitement crossings — late game context) ─────

  if (isLive && guard.prevExScore !== null) {
    const CROSSINGS = [
      {
        key:  'tense',
        min:  60,
        icon: '🔥',
        title: 'The match is getting tense',
        sub:  () => {
          const ctx = hs === as_
            ? `It's level at ${hs}–${as_} — a goal now changes everything.`
            : `${hs > as_ ? match.homeTeam : match.awayTeam} lead, but the game isn't over. Soccer can flip in one moment.`;
          return `${ctx} Clock pressure, attack patterns, and score situation are all elevated right now.`;
        },
      },
      {
        key:  'high_alert',
        min:  75,
        icon: '⚡',
        title: 'Final stretch — maximum pressure',
        sub:  () => {
          return `This is when World Cup games are decided. Tired legs, tactical changes, set pieces in dangerous areas — everything that's been building is coming to a head now.`;
        },
      },
    ];

    for (const c of CROSSINGS) {
      if (guard.prevExScore < c.min && ex.score >= c.min) {
        const lastFired = guard.firedBands[c.key] ?? 0;
        if (Date.now() - lastFired > BAND_COOLDOWN_MS) {
          guard.firedBands[c.key] = Date.now();
          out.push({
            id: `${match.id}-${c.key}-${Date.now()}`,
            type: 'tension', priority: 4,
            icon: c.icon, title: c.title, subtext: c.sub(),
            match, firedAt: Date.now(),
          });
        }
      }
    }
  }

  return out;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TYPE_COLORS = {
  teach:   '#a78bfa',
  tension: '#f59e0b',
  post:    '#22c55e',
};

const TYPE_LABELS = {
  teach:   'explain it',
  tension: 'tension',
  post:    'full time',
};

export default function LivePulse() {
  const { matches }  = useMatches();
  const today        = useMemo(makeTodayStr, []);
  const todayMatches = useMemo(() => matches.filter(m => m.date === today), [matches, today]);

  const [espnMap,    setEspnMap]    = useState({});
  const [summaryMap, setSummaryMap] = useState({});
  const [exMap,      setExMap]      = useState({});
  const [notifLog,   setNotifLog]   = useState([]);   // all fired, newest first
  const [toastStack, setToastStack] = useState([]);   // persistent stack — no auto-dismiss
  const [lastPoll,   setLastPoll]   = useState(null);
  const [pollCount,  setPollCount]  = useState(0);
  const [adminOpen,  setAdminOpen]  = useState(false);

  const guardsRef = useRef({});
  const [, tick_] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick_(n => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  // ── Persistent toast stack — cards stay until manually dismissed ───────────
  function pushToasts(notifs) {
    // Newest at top; cap at 8 visible cards (oldest drop off)
    setToastStack(prev => {
      const next = [...notifs.slice().reverse(), ...prev];
      return next.slice(0, 8);
    });
  }

  function dismissToast(id) {
    setToastStack(prev => prev.filter(t => t.id !== id));
  }

  // ── ESPN polling loop ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!todayMatches.length) return;
    let cancelled = false;

    const runTick = async () => {
      try {
        const espnEvents = await fetchEspnScoreboard(today);
        if (cancelled) return;

        const nextEspn = {};
        for (const m of todayMatches) nextEspn[m.id] = matchEspnStatus(espnEvents, m);
        setEspnMap(nextEspn);
        setLastPoll(Date.now());
        setPollCount(c => c + 1);

        const nextEx    = {};
        const newNotifs = [];

        for (const m of todayMatches) {
          const espn = nextEspn[m.id];

          if (!guardsRef.current[m.id]) {
            guardsRef.current[m.id] = {
              initialized:   false,
              prevExScore:   null,
              prevEspnState: null,
              prevPeriod:    null,
              firedBands:    {},
              firedStatKeys: new Set(),
              firedPost:     false,
            };
          }
          const guard = guardsRef.current[m.id];

          let summary = summaryMap[m.id];
          const needsSummary = espn?.state === 'in' || (espn?.state === 'post' && !guard.firedPost);
          if (needsSummary) {
            const eid = matchEspnEventId(espnEvents, m);
            if (eid) {
              try {
                const raw = await fetchEspnSummary(eid);
                if (cancelled) return;
                summary = normalizeEspnSoccerSummary(raw, m);
                setSummaryMap(prev => ({ ...prev, [m.id]: summary }));
              } catch { /* fail soft */ }
            }
          }

          const ex = computeMatchExcitement(m, espn, [], summary || {});
          nextEx[m.id] = ex;

          if (!guard.initialized) {
            guard.initialized   = true;
            guard.prevExScore   = ex.score;
            guard.prevEspnState = espn?.state ?? null;
            guard.prevPeriod    = espn?.period ?? null;
            continue;
          }

          const derived = deriveNotifs(m, espn, summary, ex, guard);
          guard.prevExScore   = ex.score;
          guard.prevEspnState = espn?.state ?? null;
          guard.prevPeriod    = espn?.period ?? null;
          if (derived.length) newNotifs.push(...derived);
        }

        setExMap(nextEx);

        if (newNotifs.length) {
          const reversed = newNotifs.slice().reverse();
          setNotifLog(prev => [...reversed, ...prev]);
          pushToasts(newNotifs);
        }
      } catch { /* fail soft */ }
    };

    runTick();
    const id = setInterval(runTick, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, todayMatches]);

  return (
    <div className="pulse-page">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="pulse-header">
        <Link to="/" className="pulse-back">← Cup Radar</Link>
        <div style={{ flex: 1 }}>
          <h1 className="pulse-title">
            Live Pulse <span className="pulse-test-badge">TEST</span>
          </h1>
          <p className="pulse-desc">
            Game-teaching notifications · ESPN polls every 30s
            {lastPoll && (
              <span className="pulse-last-poll"> · last poll {relTime(lastPoll)} (#{pollCount})</span>
            )}
          </p>
        </div>
      </div>

      <div className="pulse-layout">

        {/* ── Today's Matches ─────────────────────────────────────────────── */}
        <section>
          <h2 className="pulse-section-heading">Today&apos;s Matches</h2>
          {todayMatches.length === 0 ? (
            <p className="pulse-empty">No matches today.</p>
          ) : (
            <div className="pulse-matches">
              {todayMatches.map(m => {
                const espn    = espnMap[m.id];
                const summary = summaryMap[m.id];
                const ex      = exMap[m.id] ?? computeMatchExcitement(m, espn, [], summary || {});
                const stats   = summary?.stats;
                const isLive  = espn?.state === 'in';
                const isPost  = espn?.state === 'post' || m.status === 'finished';
                const hs      = espn?.homeScore ?? m.homeScore;
                const as_     = espn?.awayScore ?? m.awayScore;
                const guard   = guardsRef.current[m.id];

                return (
                  <div key={m.id} className={`pulse-match${isLive ? ' is-live' : ''}`}>
                    <div className="pulse-match__meta">
                      {isLive
                        ? <span className="pulse-pill pulse-pill--live">🔴 {espn.clock}</span>
                        : isPost
                          ? <span className="pulse-pill pulse-pill--done">FT</span>
                          : <span className="pulse-pill">{m.time} {m.timezone}</span>}
                      <span className="pulse-match__stage">
                        {m.group ? `Group ${m.group}` : m.stage}
                      </span>
                      <span className="pulse-guard-status">
                        {guard?.initialized
                          ? <span className="pulse-guard-ok">✓</span>
                          : <span className="pulse-guard-wait">⏳</span>}
                      </span>
                    </div>

                    <div className="pulse-match__score-row">
                      <span className="pulse-match__team">
                        <FlagImg emoji={m.homeFlag} size={18} />
                        {m.homeTeam}
                      </span>
                      <span className="pulse-match__score">
                        {isLive || isPost ? `${hs ?? '-'} – ${as_ ?? '-'}` : 'vs'}
                      </span>
                      <span className="pulse-match__team pulse-match__team--away">
                        {m.awayTeam}
                        <FlagImg emoji={m.awayFlag} size={18} />
                      </span>
                    </div>

                    {(isLive || isPost) && (
                      <div className="pulse-ex">
                        <div className="pulse-ex-bar">
                          <div className="pulse-ex-fill" style={{ width: `${ex.score}%` }} />
                        </div>
                        <span className="pulse-ex-score">{ex.score}</span>
                        <span className="pulse-ex-label">{ex.shortLabel}</span>
                      </div>
                    )}

                    {stats && (
                      <div className="pulse-stats">
                        <span>⚽ {stats.homeShots || 0}–{stats.awayShots || 0} shots</span>
                        {(stats.homeShotsOnTarget || 0) + (stats.awayShotsOnTarget || 0) > 0 && (
                          <span>🎯 {stats.homeShotsOnTarget || 0}–{stats.awayShotsOnTarget || 0} on target</span>
                        )}
                        {(stats.homePossession || 0) > 0 && (
                          <span>🏃 {stats.homePossession}%–{stats.awayPossession}% poss</span>
                        )}
                        {(stats.homeCorners || 0) + (stats.awayCorners || 0) > 0 && (
                          <span>🚩 {stats.homeCorners || 0}–{stats.awayCorners || 0} corners</span>
                        )}
                        {(stats.homeYellow || 0) + (stats.awayYellow || 0) > 0 && (
                          <span>🟨 {(stats.homeYellow || 0) + (stats.awayYellow || 0)} cards</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Notification Feed ───────────────────────────────────────────── */}
        <section>
          <h2 className="pulse-section-heading">
            Notification Feed
            {notifLog.length > 0 && (
              <span className="pulse-count">{notifLog.length} fired</span>
            )}
          </h2>

          {notifLog.length === 0 ? (
            <div className="pulse-feed-empty">
              <p>Waiting for live match data...</p>
              <p className="pulse-feed-empty__sub">
                Cards fire in three layers: guaranteed beat cards (kick-off,
                second half, full time), stat explainers (possession, corners,
                yellows, shots, fouls), and tension signals late in the match.
                First poll snapshots state — cards start on the second poll.
              </p>
              <div className="pulse-type-legend">
                {Object.entries(TYPE_COLORS).map(([type, color]) => (
                  <span key={type} className="pulse-legend-item">
                    <span className="pulse-legend-dot" style={{ background: color }} />
                    {TYPE_LABELS[type]}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="pulse-feed">
              {notifLog.map(n => (
                <div key={n.id} className="pulse-notif">
                  <span className="pulse-notif__icon">{n.icon}</span>
                  <div className="pulse-notif__body">
                    <div className="pulse-notif__title">{n.title}</div>
                    <div className="pulse-notif__sub">{n.subtext}</div>
                    <div className="pulse-notif__footer">
                      <span
                        className="pulse-notif__type"
                        style={{ background: TYPE_COLORS[n.type] ?? '#888' }}
                      >{TYPE_LABELS[n.type] ?? n.type}</span>
                      <span className="pulse-notif__match">
                        {n.match.homeTeam} vs {n.match.awayTeam}
                      </span>
                      <span className="pulse-notif__time">{relTime(n.firedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Admin Panel — live match only ───────────────────────────────────── */}
      <div className="pulse-admin" style={{ maxWidth: 1100, margin: '24px auto 0', padding: '0 24px' }}>
        <button className="pulse-admin__toggle" onClick={() => setAdminOpen(o => !o)}>
          {adminOpen ? '▾' : '▸'} Admin — raw data for current game
        </button>

        {adminOpen && (() => {
          // Only show the currently live match; fall back to most recently active
          const liveMatch = todayMatches.find(m => espnMap[m.id]?.state === 'in')
            ?? todayMatches.find(m => espnMap[m.id]?.state === 'post')
            ?? todayMatches[0];
          if (!liveMatch) return <p className="pulse-admin__null">No match data yet.</p>;

          const espn    = espnMap[liveMatch.id];
          const summary = summaryMap[liveMatch.id];
          const ex      = exMap[liveMatch.id];
          const stats   = summary?.stats;
          const guard   = guardsRef.current[liveMatch.id];

          return (
            <div className="pulse-admin__grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              <div className="pulse-admin__card">
                <div className="pulse-admin__card-title">{liveMatch.homeTeam} vs {liveMatch.awayTeam}</div>
                <div className="pulse-admin__section">ESPN</div>
                {espn ? (
                  <pre className="pulse-admin__pre">{JSON.stringify({
                    state: espn.state, clock: espn.clock,
                    period: espn.period,
                    score: `${espn.homeScore}–${espn.awayScore}`,
                  }, null, 2)}</pre>
                ) : <p className="pulse-admin__null">no ESPN data yet</p>}
              </div>

              <div className="pulse-admin__card">
                <div className="pulse-admin__card-title">Excitement</div>
                {ex ? (
                  <pre className="pulse-admin__pre">{JSON.stringify({
                    score:            ex.score,
                    band:             ex.label,
                    scorePressure:    pct(ex.components?.scorePressure),
                    clockLeverage:    pct(ex.components?.clockLeverage),
                    attackPressure:   pct(ex.components?.attackPressure),
                    stageAndScenario: pct(ex.components?.stageAndScenario),
                    upsetPressure:    pct(ex.components?.upsetPressure),
                    chaosBonus:       pct(ex.components?.chaosBonus),
                    finishBonus:      pct(ex.components?.finishBonus),
                  }, null, 2)}</pre>
                ) : <p className="pulse-admin__null">not yet computed</p>}
              </div>

              <div className="pulse-admin__card">
                <div className="pulse-admin__card-title">Stats</div>
                {stats ? (
                  <pre className="pulse-admin__pre">{JSON.stringify({
                    shots:      `${stats.homeShots || 0}–${stats.awayShots || 0}`,
                    onTarget:   `${stats.homeShotsOnTarget || 0}–${stats.awayShotsOnTarget || 0}`,
                    possession: `${stats.homePossession || 0}%–${stats.awayPossession || 0}%`,
                    corners:    `${stats.homeCorners || 0}–${stats.awayCorners || 0}`,
                    yellows:    `${stats.homeYellow || 0}–${stats.awayYellow || 0}`,
                    reds:       `${stats.homeRed || 0}–${stats.awayRed || 0}`,
                    fouls:      `${stats.homeFouls || 0}–${stats.awayFouls || 0}`,
                  }, null, 2)}</pre>
                ) : <p className="pulse-admin__null">no summary yet</p>}
              </div>

              <div className="pulse-admin__card">
                <div className="pulse-admin__card-title">Guard state</div>
                {guard ? (
                  <pre className="pulse-admin__pre">{JSON.stringify({
                    initialized:   guard.initialized,
                    prevExScore:   guard.prevExScore,
                    prevState:     guard.prevEspnState,
                    prevPeriod:    guard.prevPeriod,
                    firedPost:     guard.firedPost,
                    firedBands:    Object.keys(guard.firedBands),
                    firedStatKeys: [...guard.firedStatKeys],
                  }, null, 2)}</pre>
                ) : <p className="pulse-admin__null">not initialized</p>}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Persistent toast stack — stays until dismissed ───────────────────── */}
      {toastStack.length > 0 && (
        <div className="pulse-toast-stack" role="log" aria-label="Notifications" aria-live="polite">
          {toastStack.map(n => (
            <div key={n.id} className={`pulse-toast pulse-toast--${n.type}`}>
              <span className="pulse-toast__icon">{n.icon}</span>
              <div className="pulse-toast__body">
                <div className="pulse-toast__title">{n.title}</div>
                <div className="pulse-toast__sub">{n.subtext}</div>
                <div className="pulse-toast__meta">
                  <span
                    className="pulse-notif__type"
                    style={{ background: TYPE_COLORS[n.type] ?? '#888' }}
                  >{TYPE_LABELS[n.type] ?? n.type}</span>
                  <span className="pulse-toast__time">{relTime(n.firedAt)}</span>
                </div>
              </div>
              <button
                className="pulse-toast__dismiss"
                aria-label="Dismiss"
                onClick={() => dismissToast(n.id)}
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
