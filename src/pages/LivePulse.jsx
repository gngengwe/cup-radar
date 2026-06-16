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
  if (s < 15)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function bandLabel(score) {
  if (score >= 85) return 'Goal Right Here';
  if (score >= 75) return 'High Alert';
  if (score >= 60) return 'Tense';
  if (score >= 40) return 'Building';
  return 'Calm';
}

// ─── Notification derivation (delay-safe conditions only) ─────────────────────
//
// Rules:
//   ✓ Excitement band crossings — driven by aggregated signals, not events
//   ✓ Stats patterns       — cumulative totals, not instant moments
//   ✓ Post-match summary   — fires after ESPN confirms full-time
//   ✗ Goals / cards / pens — direct event spoilers, excluded
//   ✗ Clock milestones     — drift with streaming delay, excluded
//   ✗ "Goal Right Here"    — correlates with goals having just happened

const BAND_COOLDOWN_MS = 3 * 60_000;

function deriveNotifs(match, espn, summary, ex, guard) {
  const out = [];
  const isLive = espn?.state === 'in';
  const isPost = espn?.state === 'post';
  const stats = summary?.stats;
  const homeScore = espn?.homeScore ?? 0;
  const awayScore = espn?.awayScore ?? 0;
  const clock = espn?.clock ?? '';

  // ── Tension: excitement band crossings ───────────────────────────────────
  if (isLive && guard.prevExScore !== null) {
    const CROSSINGS = [
      {
        key:     'tense',
        min:     60,
        icon:    '📈',
        title:   'Match is getting tense',
        subtext: () => `${match.homeTeam} ${homeScore}–${awayScore} ${match.awayTeam} · ${clock} · score pressure + clock converging`,
      },
      {
        key:     'high_alert',
        min:     75,
        icon:    '🔥',
        title:   'High Alert — multiple signals converging',
        subtext: () => `${match.homeTeam} vs ${match.awayTeam} · ${clock} · attack, clock, and pressure all elevated`,
      },
      // 85 "Goal Right Here" deliberately excluded — too correlated with a goal event
    ];

    for (const c of CROSSINGS) {
      if (guard.prevExScore < c.min && ex.score >= c.min) {
        const lastFired = guard.firedBands[c.key] ?? 0;
        if (Date.now() - lastFired > BAND_COOLDOWN_MS) {
          guard.firedBands[c.key] = Date.now();
          out.push({
            id: `${match.id}-${c.key}-${Date.now()}`,
            type: 'tension', priority: 4,
            icon: c.icon, title: c.title, subtext: c.subtext(),
            match, firedAt: Date.now(),
          });
        }
      }
    }
  }

  // ── Stats: many shots, still goalless ────────────────────────────────────
  if (isLive && stats) {
    const totalShots = (stats.homeShots || 0) + (stats.awayShots || 0);
    const totalGoals = homeScore + awayScore;

    if (totalShots >= 8 && totalGoals === 0 && !guard.firedStatKeys.has('shots-dry')) {
      guard.firedStatKeys.add('shots-dry');
      out.push({
        id: `${match.id}-shots-dry`,
        type: 'stats', priority: 2, icon: '📊',
        title: `${totalShots} shots — still goalless`,
        subtext: `${match.homeTeam} ${stats.homeShots || 0} – ${stats.awayShots || 0} ${match.awayTeam} · both keepers holding firm`,
        match, firedAt: Date.now(),
      });
    }

    // ── Possession dominance while trailing ─────────────────────────────
    const homePoss = stats.homePossession || 0;
    const awayPoss = stats.awayPossession || 0;

    if (homePoss >= 68 && homeScore < awayScore && !guard.firedStatKeys.has('poss-home')) {
      guard.firedStatKeys.add('poss-home');
      out.push({
        id: `${match.id}-poss-home`,
        type: 'stats', priority: 2, icon: '📊',
        title: `${homePoss}% possession for ${match.homeTeam} — but they trail`,
        subtext: `${match.awayTeam} leading on the counter · the ball isn't scoring`,
        match, firedAt: Date.now(),
      });
    }
    if (awayPoss >= 68 && awayScore < homeScore && !guard.firedStatKeys.has('poss-away')) {
      guard.firedStatKeys.add('poss-away');
      out.push({
        id: `${match.id}-poss-away`,
        type: 'stats', priority: 2, icon: '📊',
        title: `${awayPoss}% possession for ${match.awayTeam} — but they trail`,
        subtext: `${match.homeTeam} leading on the counter · the ball isn't scoring`,
        match, firedAt: Date.now(),
      });
    }

    // ── Card accumulation ───────────────────────────────────────────────
    const totalYellow = (stats.homeYellow || 0) + (stats.awayYellow || 0);
    if (totalYellow >= 4 && !guard.firedStatKeys.has('cards-4')) {
      guard.firedStatKeys.add('cards-4');
      out.push({
        id: `${match.id}-cards-4`,
        type: 'stats', priority: 2, icon: '🟨',
        title: `${totalYellow} yellow cards and counting`,
        subtext: `${match.homeTeam} ${stats.homeYellow || 0} – ${stats.awayYellow || 0} ${match.awayTeam} · referee busy`,
        match, firedAt: Date.now(),
      });
    }

    // ── Corner barrage (pressure without the goal) ──────────────────────
    const totalCorners = (stats.homeCorners || 0) + (stats.awayCorners || 0);
    if (totalCorners >= 10 && totalGoals === 0 && !guard.firedStatKeys.has('corners-barrage')) {
      guard.firedStatKeys.add('corners-barrage');
      out.push({
        id: `${match.id}-corners-barrage`,
        type: 'stats', priority: 2, icon: '🚩',
        title: `${totalCorners} corners — still no goals`,
        subtext: `${match.homeTeam} ${stats.homeCorners || 0} – ${stats.awayCorners || 0} ${match.awayTeam} · lot of pressure, no reward`,
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
      title: `FT: ${match.homeTeam} ${homeScore}–${awayScore} ${match.awayTeam}`,
      subtext: `Match quality: ${ex.score} · ${bandLabel(ex.score)}`,
      match, firedAt: Date.now(),
    });
  }

  return out;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TYPE_COLORS = {
  tension: '#f59e0b',
  stats:   '#3b82f6',
  post:    '#22c55e',
};

export default function LivePulse() {
  const { matches }  = useMatches();
  const today        = useMemo(makeTodayStr, []);
  const todayMatches = useMemo(() => matches.filter(m => m.date === today), [matches, today]);

  const [espnMap,    setEspnMap]    = useState({});
  const [summaryMap, setSummaryMap] = useState({});
  const [notifLog,   setNotifLog]   = useState([]);   // all fired, newest first
  const [toast,      setToast]      = useState(null); // visible toast

  const toastQueueRef  = useRef([]);
  const isShowingRef   = useRef(false);
  const showNextRef    = useRef(null);
  const guardsRef      = useRef({});
  const [, tick_]      = useState(0); // forces re-render for relTime updates

  // Relative-time ticker
  useEffect(() => {
    const id = setInterval(() => tick_(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // ── Toast queue ────────────────────────────────────────────────────────────
  showNextRef.current = () => {
    if (!toastQueueRef.current.length) {
      setToast(null);
      isShowingRef.current = false;
      return;
    }
    const next = toastQueueRef.current.shift();
    setToast(next);
    isShowingRef.current = true;
    const ttl = next.type === 'post' ? 7000 : 5000;
    setTimeout(() => showNextRef.current(), ttl);
  };

  function pushToasts(notifs) {
    // Sort by priority desc before queuing; cap queue at 4 (drop lowest priority)
    const sorted = [...notifs].sort((a, b) => b.priority - a.priority);
    toastQueueRef.current.push(...sorted);
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

        const newNotifs = [];

        for (const m of todayMatches) {
          const espn = nextEspn[m.id];

          // Init guard
          if (!guardsRef.current[m.id]) {
            guardsRef.current[m.id] = {
              initialized: false,
              prevExScore: null,
              firedBands:  {},
              firedStatKeys: new Set(),
              firedPost: false,
            };
          }
          const guard = guardsRef.current[m.id];

          // Fetch summary for live matches and first post-match read
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

          if (!guard.initialized) {
            // First poll — snapshot current state, fire nothing
            guard.initialized = true;
            guard.prevExScore = ex.score;
            continue;
          }

          const derived = deriveNotifs(m, espn, summary, ex, guard);
          guard.prevExScore = ex.score;
          if (derived.length) newNotifs.push(...derived);
        }

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
        <div>
          <h1 className="pulse-title">
            Live Pulse <span className="pulse-test-badge">TEST</span>
          </h1>
          <p className="pulse-desc">
            Delay-safe condition notifications · no event spoilers · ESPN polls every 30s
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
                const ex      = computeMatchExcitement(m, espn, [], summary || {});
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
              <span className="pulse-count">{notifLog.length} fired this session</span>
            )}
          </h2>

          {notifLog.length === 0 ? (
            <div className="pulse-feed-empty">
              <p>Waiting for conditions to trigger...</p>
              <p className="pulse-feed-empty__sub">
                First poll snapshots current state — notifications begin on the
                second poll (~30s). Triggers: excitement band crossings,
                stats thresholds (8+ shots goalless, 68%+ possession while
                trailing, 4+ yellows), and full-time results.
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
                        style={{ background: TYPE_COLORS[n.type] }}
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

      {/* ── Toast overlay ───────────────────────────────────────────────────── */}
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
