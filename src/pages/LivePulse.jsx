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

function bandLabel(score) {
  if (score >= 85) return 'Goal Right Here';
  if (score >= 75) return 'High Alert';
  if (score >= 60) return 'Tense';
  if (score >= 40) return 'Building';
  return 'Calm';
}

function pct(v) { return v != null ? `${Math.round(v * 100)}%` : '—'; }

// ─── Notification derivation ──────────────────────────────────────────────────
//
// Delay-safe rules only:
//   ✓ State transitions (kick-off, half-time, full-time) — ESPN state, not clock
//   ✓ Excitement band crossings — aggregated signals, not event-correlated
//   ✓ Stats patterns — cumulative totals, not instant moments
//   ✗ Goals / cards / pens — direct event spoilers
//   ✗ Clock milestones — drift with streaming delay
//   ✗ "Goal Right Here" band — correlates with goals having just happened

const BAND_COOLDOWN_MS = 3 * 60_000;

function deriveNotifs(match, espn, summary, ex, guard) {
  const out   = [];
  const isLive = espn?.state === 'in';
  const isPost = espn?.state === 'post';
  const stats  = summary?.stats;
  const hs     = espn?.homeScore ?? 0;
  const as_    = espn?.awayScore ?? 0;
  const clock  = espn?.clock ?? '';
  const period = espn?.period ?? 0;

  // ── State transition: kick-off ───────────────────────────────────────────
  if (isLive && guard.prevEspnState !== 'in') {
    out.push({
      id: `${match.id}-kickoff`,
      type: 'state', priority: 3, icon: '⚽',
      title: `Kick-off: ${match.homeTeam} vs ${match.awayTeam}`,
      subtext: `ESPN confirms the match is underway`,
      match, firedAt: Date.now(),
    });
  }

  // ── State transition: second half ────────────────────────────────────────
  if (isLive && period >= 2 && (guard.prevPeriod ?? 0) < 2 && !guard.firedStatKeys.has('second-half')) {
    guard.firedStatKeys.add('second-half');
    out.push({
      id: `${match.id}-second-half`,
      type: 'state', priority: 3, icon: '🔄',
      title: `Second half underway · ${match.homeTeam} ${hs}–${as_} ${match.awayTeam}`,
      subtext: hs === as_
        ? `Still level at the break · 45 minutes to decide it`
        : `${hs > as_ ? match.homeTeam : match.awayTeam} lead at half · can ${hs < as_ ? match.homeTeam : match.awayTeam} respond?`,
      match, firedAt: Date.now(),
    });
  }

  // ── Excitement band crossings (delay-safe: conditions, not events) ────────
  if (isLive && guard.prevExScore !== null) {
    const CROSSINGS = [
      {
        key:  'building',
        min:  40,
        icon: '📈',
        title: 'Match heating up',
        sub:  () => `${match.homeTeam} ${hs}–${as_} ${match.awayTeam} · ${clock} · activity picking up`,
      },
      {
        key:  'tense',
        min:  60,
        icon: '🔥',
        title: 'Getting tense',
        sub:  () => `${match.homeTeam} ${hs}–${as_} ${match.awayTeam} · ${clock} · score pressure + clock converging`,
      },
      {
        key:  'high_alert',
        min:  75,
        icon: '⚡',
        title: 'High Alert — multiple signals converging',
        sub:  () => `${match.homeTeam} vs ${match.awayTeam} · ${clock} · attack, clock, and pressure all elevated`,
      },
      // 85 "Goal Right Here" excluded — too correlated with goals
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

  // ── Stats notifications ───────────────────────────────────────────────────
  if (isLive && stats) {
    const totalShots   = (stats.homeShots   || 0) + (stats.awayShots   || 0);
    const totalGoals   = hs + as_;
    const totalYellow  = (stats.homeYellow  || 0) + (stats.awayYellow  || 0);
    const totalCorners = (stats.homeCorners || 0) + (stats.awayCorners || 0);
    const homePoss     = stats.homePossession || 0;
    const awayPoss     = stats.awayPossession || 0;

    // Shots piling up without a goal (lowered to 4)
    if (totalShots >= 4 && totalGoals === 0 && !guard.firedStatKeys.has('shots-dry')) {
      guard.firedStatKeys.add('shots-dry');
      out.push({
        id: `${match.id}-shots-dry`,
        type: 'stats', priority: 2, icon: '📊',
        title: `${totalShots} shots — still goalless`,
        subtext: `${match.homeTeam} ${stats.homeShots || 0} – ${stats.awayShots || 0} ${match.awayTeam} · both keepers holding firm`,
        match, firedAt: Date.now(),
      });
    }

    // Possession dominance while level or trailing (lowered to 62%)
    if (homePoss >= 62 && hs <= as_ && !guard.firedStatKeys.has('poss-home')) {
      guard.firedStatKeys.add('poss-home');
      out.push({
        id: `${match.id}-poss-home`,
        type: 'stats', priority: 2, icon: '📊',
        title: `${homePoss}% possession for ${match.homeTeam}`,
        subtext: hs < as_ ? `But they trail — ${match.awayTeam} defending on the counter`
                          : `Level but controlling — can they convert?`,
        match, firedAt: Date.now(),
      });
    }
    if (awayPoss >= 62 && as_ <= hs && !guard.firedStatKeys.has('poss-away')) {
      guard.firedStatKeys.add('poss-away');
      out.push({
        id: `${match.id}-poss-away`,
        type: 'stats', priority: 2, icon: '📊',
        title: `${awayPoss}% possession for ${match.awayTeam}`,
        subtext: as_ < hs ? `But they trail — ${match.homeTeam} holding on the counter`
                           : `Level but controlling — can they convert?`,
        match, firedAt: Date.now(),
      });
    }

    // Card accumulation (lowered to 2)
    if (totalYellow >= 2 && !guard.firedStatKeys.has('cards-2')) {
      guard.firedStatKeys.add('cards-2');
      out.push({
        id: `${match.id}-cards-2`,
        type: 'stats', priority: 2, icon: '🟨',
        title: `${totalYellow} yellow cards — feisty`,
        subtext: `${match.homeTeam} ${stats.homeYellow || 0} – ${stats.awayYellow || 0} ${match.awayTeam} · referee busy`,
        match, firedAt: Date.now(),
      });
    }
    if (totalYellow >= 5 && !guard.firedStatKeys.has('cards-5')) {
      guard.firedStatKeys.add('cards-5');
      out.push({
        id: `${match.id}-cards-5`,
        type: 'stats', priority: 2, icon: '🟨',
        title: `${totalYellow} yellow cards and counting`,
        subtext: `${match.homeTeam} ${stats.homeYellow || 0} – ${stats.awayYellow || 0} ${match.awayTeam} · this one's getting heated`,
        match, firedAt: Date.now(),
      });
    }

    // Corner barrage (lowered to 5)
    if (totalCorners >= 5 && !guard.firedStatKeys.has('corners-5')) {
      guard.firedStatKeys.add('corners-5');
      out.push({
        id: `${match.id}-corners-5`,
        type: 'stats', priority: 2, icon: '🚩',
        title: `${totalCorners} corners — ${totalGoals === 0 ? 'still no goals' : 'lots of set pieces'}`,
        subtext: `${match.homeTeam} ${stats.homeCorners || 0} – ${stats.awayCorners || 0} ${match.awayTeam}`,
        match, firedAt: Date.now(),
      });
    }
  }

  // ── Post-match summary (zero delay risk — match is over) ──────────────────
  if (isPost && !guard.firedPost) {
    guard.firedPost = true;
    out.push({
      id: `${match.id}-post`,
      type: 'post', priority: 5, icon: '🏁',
      title: `FT: ${match.homeTeam} ${hs}–${as_} ${match.awayTeam}`,
      subtext: `Match quality: ${ex.score} · ${bandLabel(ex.score)}`,
      match, firedAt: Date.now(),
    });
  }

  return out;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TYPE_COLORS = {
  state:   '#a78bfa',
  tension: '#f59e0b',
  stats:   '#3b82f6',
  post:    '#22c55e',
};

export default function LivePulse() {
  const { matches }  = useMatches();
  const today        = useMemo(makeTodayStr, []);
  const todayMatches = useMemo(() => matches.filter(m => m.date === today), [matches, today]);

  const [espnMap,      setEspnMap]      = useState({});
  const [summaryMap,   setSummaryMap]   = useState({});
  const [exMap,        setExMap]        = useState({});   // excitement results
  const [notifLog,     setNotifLog]     = useState([]);
  const [toast,        setToast]        = useState(null);
  const [lastPoll,     setLastPoll]     = useState(null);
  const [adminOpen,    setAdminOpen]    = useState(true);
  const [pollCount,    setPollCount]    = useState(0);

  const toastQueueRef = useRef([]);
  const isShowingRef  = useRef(false);
  const showNextRef   = useRef(null);
  const guardsRef     = useRef({});
  const [, tick_]     = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick_(n => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  // ── Toast queue ────────────────────────────────────────────────────────────
  showNextRef.current = () => {
    if (!toastQueueRef.current.length) { setToast(null); isShowingRef.current = false; return; }
    const next = toastQueueRef.current.shift();
    setToast(next);
    isShowingRef.current = true;
    setTimeout(() => showNextRef.current(), next.type === 'post' ? 7000 : 5000);
  };

  function pushToasts(notifs) {
    toastQueueRef.current.push(...[...notifs].sort((a, b) => b.priority - a.priority));
    if (toastQueueRef.current.length > 4) {
      toastQueueRef.current.sort((a, b) => b.priority - a.priority);
      toastQueueRef.current.length = 4;
    }
    if (!isShowingRef.current) showNextRef.current();
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

        const nextEx = {};
        const newNotifs = [];

        for (const m of todayMatches) {
          const espn = nextEspn[m.id];

          if (!guardsRef.current[m.id]) {
            guardsRef.current[m.id] = {
              initialized:  false,
              prevExScore:  null,
              prevEspnState: null,
              prevPeriod:   null,
              firedBands:   {},
              firedStatKeys: new Set(),
              firedPost:    false,
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
          setNotifLog(prev => [...newNotifs.slice().reverse(), ...prev]);
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
            Delay-safe condition notifications · no event spoilers · ESPN polls every 30s
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
                          ? <span className="pulse-guard-ok">✓ watching</span>
                          : <span className="pulse-guard-wait">⏳ pending</span>}
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
              <p>Waiting for conditions to trigger...</p>
              <p className="pulse-feed-empty__sub">
                First poll snapshots current state; second poll (~30s) starts firing.
                Active triggers: kick-off, 2nd half, excitement bands (40/60/75),
                4+ shots goalless, 62%+ possession, 2+ cards, 5+ corners.
              </p>
              <div className="pulse-type-legend">
                {Object.entries(TYPE_COLORS).map(([type, color]) => (
                  <span key={type} className="pulse-legend-item">
                    <span className="pulse-legend-dot" style={{ background: color }} />
                    {type}
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
                      >{n.type}</span>
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

      {/* ── Admin Data Panel ────────────────────────────────────────────────── */}
      <div className="pulse-admin" style={{ maxWidth: 1100, margin: '24px auto 0', padding: '0 24px' }}>
        <button
          className="pulse-admin__toggle"
          onClick={() => setAdminOpen(o => !o)}
        >
          {adminOpen ? '▾' : '▸'} Admin — raw ESPN data &amp; trigger state
        </button>

        {adminOpen && (
          <div className="pulse-admin__grid">
            {todayMatches.map(m => {
              const espn    = espnMap[m.id];
              const summary = summaryMap[m.id];
              const ex      = exMap[m.id];
              const stats   = summary?.stats;
              const guard   = guardsRef.current[m.id];

              return (
                <div key={m.id} className="pulse-admin__card">
                  <div className="pulse-admin__card-title">
                    {m.homeTeam} vs {m.awayTeam}
                  </div>

                  {/* ESPN raw */}
                  <div className="pulse-admin__section">ESPN</div>
                  {espn ? (
                    <pre className="pulse-admin__pre">{JSON.stringify({
                      state:     espn.state,
                      clock:     espn.clock,
                      period:    espn.period,
                      homeScore: espn.homeScore,
                      awayScore: espn.awayScore,
                    }, null, 2)}</pre>
                  ) : (
                    <p className="pulse-admin__null">no ESPN data yet</p>
                  )}

                  {/* Excitement */}
                  {ex && (
                    <>
                      <div className="pulse-admin__section">Excitement</div>
                      <pre className="pulse-admin__pre">{JSON.stringify({
                        score:            ex.score,
                        band:             ex.label,
                        phase:            ex.phase,
                        minute:           ex.minute,
                        scorePressure:    pct(ex.components?.scorePressure),
                        clockLeverage:    pct(ex.components?.clockLeverage),
                        attackPressure:   pct(ex.components?.attackPressure),
                        stageAndScenario: pct(ex.components?.stageAndScenario),
                        upsetPressure:    pct(ex.components?.upsetPressure),
                        leadSwingDrama:   pct(ex.components?.leadSwingDrama),
                        chaosBonus:       pct(ex.components?.chaosBonus),
                        finishBonus:      pct(ex.components?.finishBonus),
                      }, null, 2)}</pre>
                    </>
                  )}

                  {/* Stats */}
                  {stats ? (
                    <>
                      <div className="pulse-admin__section">Stats</div>
                      <pre className="pulse-admin__pre">{JSON.stringify({
                        shots:         `${stats.homeShots || 0}–${stats.awayShots || 0}`,
                        onTarget:      `${stats.homeShotsOnTarget || 0}–${stats.awayShotsOnTarget || 0}`,
                        possession:    `${stats.homePossession || 0}%–${stats.awayPossession || 0}%`,
                        corners:       `${stats.homeCorners || 0}–${stats.awayCorners || 0}`,
                        yellows:       `${stats.homeYellow || 0}–${stats.awayYellow || 0}`,
                        reds:          `${stats.homeRed || 0}–${stats.awayRed || 0}`,
                        fouls:         `${stats.homeFouls || 0}–${stats.awayFouls || 0}`,
                      }, null, 2)}</pre>
                    </>
                  ) : (
                    <p className="pulse-admin__null">no summary yet</p>
                  )}

                  {/* Guard state */}
                  {guard && (
                    <>
                      <div className="pulse-admin__section">Guard state</div>
                      <pre className="pulse-admin__pre">{JSON.stringify({
                        initialized:   guard.initialized,
                        prevExScore:   guard.prevExScore,
                        prevState:     guard.prevEspnState,
                        prevPeriod:    guard.prevPeriod,
                        firedPost:     guard.firedPost,
                        firedBands:    Object.keys(guard.firedBands),
                        firedStatKeys: [...guard.firedStatKeys],
                      }, null, 2)}</pre>
                    </>
                  )}
                </div>
              );
            })}
            {todayMatches.length === 0 && (
              <p className="pulse-admin__null">No matches today.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          key={toast.id}
          className={`pulse-toast pulse-toast--${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <span className="pulse-toast__icon">{toast.icon}</span>
          <div className="pulse-toast__body">
            <div className="pulse-toast__title">{toast.title}</div>
            <div className="pulse-toast__sub">{toast.subtext}</div>
          </div>
          <button
            className="pulse-toast__dismiss"
            aria-label="Dismiss"
            onClick={() => { setToast(null); isShowingRef.current = false; showNextRef.current(); }}
          >×</button>
        </div>
      )}
    </div>
  );
}
