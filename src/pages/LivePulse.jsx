import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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

function parseMinute(clock) {
  if (!clock) return null;
  const m = clock.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

// ─── Clock milestone cards ─────────────────────────────────────────────────────

const MILESTONES = {
  10: {
    icon: '🕐', title: '10 minutes in — early pulse check',
    body: (match, espn, stats) => {
      const hs = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      const poss = (stats?.homePossession || 0) > 0
        ? `${Math.max(stats.homePossession, stats.awayPossession)}% possession for ${stats.homePossession >= stats.awayPossession ? match.homeTeam : match.awayTeam}. ` : '';
      return `${match.homeTeam} ${hs}–${as_} ${match.awayTeam}. ${poss}In the World Cup, the first 15 minutes are tactical — teams test defensive shape before committing forward. Goals are rarer early.`;
    },
  },
  20: {
    icon: '🕑', title: '20 minutes in — patterns forming',
    body: (match, espn, stats) => {
      const hs = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      const shots = stats ? `${(stats.homeShots||0)+(stats.awayShots||0)} shots so far. ` : '';
      return `${match.homeTeam} ${hs}–${as_} ${match.awayTeam}. ${shots}The team that scores first in a World Cup match wins roughly 70% of the time — every chance matters.`;
    },
  },
  30: {
    icon: '🕒', title: 'Half hour mark',
    body: (match, espn, stats) => {
      const hs = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      const poss = (stats?.homePossession || 0) > 0
        ? `${Math.max(stats.homePossession, stats.awayPossession)}% possession for ${stats.homePossession >= stats.awayPossession ? match.homeTeam : match.awayTeam}. ` : '';
      return `${match.homeTeam} ${hs}–${as_} ${match.awayTeam}. ${poss}Goals cluster in the final 15 minutes of each half — teams push harder as halftime approaches.`;
    },
  },
  40: {
    icon: '⏱️', title: '5 minutes to halftime',
    body: (match, espn, stats) => {
      const hs = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      const onTarget = stats ? `${(stats.homeShotsOnTarget||0)+(stats.awayShotsOnTarget||0)} shots on target so far. ` : '';
      return `${match.homeTeam} ${hs}–${as_} ${match.awayTeam}. ${onTarget}Teams either protect what they have or push for a goal before the break. Expect intensity to spike.`;
    },
  },
  60: {
    icon: '🕕', title: 'Hour mark — this is when games change',
    body: (match, espn, stats) => {
      const hs = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      const corners = stats ? `${(stats.homeCorners||0)+(stats.awayCorners||0)} corners, ` : '';
      const fouls   = stats ? `${(stats.homeFouls||0)+(stats.awayFouls||0)} fouls. ` : '';
      return `${match.homeTeam} ${hs}–${as_} ${match.awayTeam}. ${corners}${fouls}The 60th–75th minute produces more World Cup goals than any other window. Substitutions bring fresh legs — and change the match.`;
    },
  },
  70: {
    icon: '🕖', title: '20 minutes left',
    body: (match, espn) => {
      const hs = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      const lead = hs !== as_
        ? `${hs > as_ ? match.homeTeam : match.awayTeam} lead — but no lead is safe until the final whistle.`
        : `Still level — one set piece, one mistake, one moment decides it.`;
      return `${lead} Tired defenders make more errors. Set pieces near the box are extremely dangerous now.`;
    },
  },
  80: {
    icon: '⏰', title: '10 minutes of normal time left',
    body: (match, espn, stats) => {
      const hs = espn?.homeScore ?? 0, as_ = espn?.awayScore ?? 0;
      const shots = stats ? ` ${(stats.homeShots||0)+(stats.awayShots||0)} combined shots.` : '';
      return `${match.homeTeam} ${hs}–${as_} ${match.awayTeam}.${shots} Referees add 3–6 minutes of injury time — the clock won't stop at 90. World Cup games are often decided right here.`;
    },
  },
};

// ─── Notification derivation ──────────────────────────────────────────────────

const BAND_COOLDOWN_MS = 3 * 60_000;

function deriveNotifs(match, espn, summary, ex, guard) {
  const out    = [];
  const isLive = espn?.state === 'in';
  const isPost = espn?.state === 'post';
  const stats  = summary?.stats;
  const hs     = espn?.homeScore ?? 0;
  const as_    = espn?.awayScore ?? 0;
  const period = espn?.period ?? 0;
  const currentMinute = parseMinute(espn?.clock) ?? null;

  // ── LAYER 1: BEAT CARDS ──────────────────────────────────────────────────

  if (isLive && guard.prevEspnState !== 'in' && !guard.firedStatKeys.has('kickoff')) {
    guard.firedStatKeys.add('kickoff');
    const stageCtx = match.group
      ? `Group ${match.group} — 3 points for a win, 1 for a draw`
      : match.stage || 'Knockout round';
    out.push({
      id: `${match.id}-kickoff`, type: 'beat', priority: 3, icon: '⚽',
      title: `Underway: ${match.homeTeam} vs ${match.awayTeam}`,
      subtext: `${stageCtx}. Watch who controls the ball in the first 10 minutes — the team that sets the tempo early often dictates the whole match.`,
      match, firedAt: Date.now(), matchMinute: 0,
    });
  }

  if (isLive && period >= 2 && (guard.prevPeriod ?? 0) < 2 && !guard.firedStatKeys.has('second-half')) {
    guard.firedStatKeys.add('second-half');
    let htStat = '';
    if (stats) {
      const totalShots = (stats.homeShots||0)+(stats.awayShots||0);
      const homePoss = stats.homePossession || 0, awayPoss = stats.awayPossession || 0;
      const who = homePoss >= awayPoss ? match.homeTeam : match.awayTeam;
      const val = Math.max(homePoss, awayPoss);
      htStat = val > 0
        ? `${who} had ${val}% of the ball and there were ${totalShots} shots. `
        : `${totalShots} shots in the first half. `;
    }
    const scoreCtx = hs === as_
      ? `Still ${hs}–${as_} — 45 minutes to break the deadlock.`
      : `${hs > as_ ? match.homeTeam : match.awayTeam} lead ${Math.max(hs,as_)}–${Math.min(hs,as_)}. The trailing team will push forward and leave space at the back.`;
    out.push({
      id: `${match.id}-second-half`, type: 'beat', priority: 3, icon: '🔄',
      title: `Second half — here's the story so far`,
      subtext: `${htStat}${scoreCtx}`,
      match, firedAt: Date.now(), matchMinute: 45,
    });
  }

  if (isPost && !guard.firedPost) {
    guard.firedPost = true;
    let shotLine = '';
    if (stats) {
      const total = (stats.homeShots||0)+(stats.awayShots||0);
      shotLine = ` ${total} combined shots across 90 minutes.`;
    }
    const resultLine = hs === as_ ? `Both teams take 1 point.` : `${hs > as_ ? match.homeTeam : match.awayTeam} take all 3 points.`;
    out.push({
      id: `${match.id}-post`, type: 'post', priority: 5, icon: '🏁',
      title: `Full time: ${match.homeTeam} ${hs}–${as_} ${match.awayTeam}`,
      subtext: `${resultLine}${shotLine}`,
      match, firedAt: Date.now(), matchMinute: 90,
    });
  }

  // ── LAYER 2: CLOCK MILESTONES ─────────────────────────────────────────────

  if (isLive && currentMinute !== null) {
    for (const [target, cfg] of Object.entries(MILESTONES)) {
      const t = Number(target);
      if (currentMinute >= t && !guard.firedStatKeys.has(`milestone-${t}`)) {
        guard.firedStatKeys.add(`milestone-${t}`);
        out.push({
          id: `${match.id}-milestone-${t}`, type: 'milestone', priority: 1,
          icon: cfg.icon, title: cfg.title,
          subtext: cfg.body(match, espn, stats),
          match, firedAt: Date.now(), matchMinute: t,
        });
      }
    }
  }

  // ── LAYER 3: EXPLAIN IT CARDS ─────────────────────────────────────────────

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

    if ((homePoss > 0 || awayPoss > 0) && !guard.firedStatKeys.has('possession-intro')) {
      guard.firedStatKeys.add('possession-intro');
      const who = homePoss >= awayPoss ? match.homeTeam : match.awayTeam;
      const other = homePoss >= awayPoss ? match.awayTeam : match.homeTeam;
      const val = Math.max(homePoss, awayPoss);
      out.push({
        id: `${match.id}-possession-intro`, type: 'explain', priority: 2, icon: '📊',
        title: `${who} with ${val}% possession`,
        subtext: `Possession = how much each team has had the ball. High possession can mean control — or ${other} is sitting deep and waiting to counter-attack. Watch the shots column to see which story this becomes.`,
        match, firedAt: Date.now(), matchMinute: currentMinute,
      });
    }

    if (totalCorners >= 1 && !guard.firedStatKeys.has('corner-intro')) {
      guard.firedStatKeys.add('corner-intro');
      out.push({
        id: `${match.id}-corner-intro`, type: 'explain', priority: 2, icon: '🚩',
        title: `First corner kick of the match`,
        subtext: `A corner happens when a defender puts the ball over their own goal line. The attacking team gets a free kick from the corner flag — a prime chance for a headed goal. About 1 in 10 World Cup goals comes from a corner situation.`,
        match, firedAt: Date.now(), matchMinute: currentMinute,
      });
    }

    if (totalYellow >= 1 && !guard.firedStatKeys.has('yellow-intro')) {
      guard.firedStatKeys.add('yellow-intro');
      out.push({
        id: `${match.id}-yellow-intro`, type: 'explain', priority: 2, icon: '🟨',
        title: `First yellow card`,
        subtext: `A yellow is a formal warning. Two yellows in one game = sent off (10 vs 11 for the rest of the match). Two yellows across different tournament games = suspended next match — teams in the knockouts protect key players carefully.`,
        match, firedAt: Date.now(), matchMinute: currentMinute,
      });
    }

    if (totalShots >= 5 && totalGoals === 0 && !guard.firedStatKeys.has('shot-drought')) {
      guard.firedStatKeys.add('shot-drought');
      out.push({
        id: `${match.id}-shot-drought`, type: 'explain', priority: 2, icon: '🧤',
        title: `${totalShots} shots — both keepers holding firm`,
        subtext: `Most shots in soccer don't score. A goalkeeper saves around 70% of shots on target, and many miss entirely. The World Cup average is 2–3 goals per 90 minutes — patience is a weapon.`,
        match, firedAt: Date.now(), matchMinute: currentMinute,
      });
    }

    if (!guard.firedStatKeys.has('counter-attack')) {
      const homeCountering = awayPoss >= 60 && homeShots >= awayShots && totalShots >= 4;
      const awayCountering = homePoss >= 60 && awayShots >= homeShots && totalShots >= 4;
      if (homeCountering || awayCountering) {
        guard.firedStatKeys.add('counter-attack');
        const counter   = homeCountering ? match.homeTeam : match.awayTeam;
        const dominant  = homeCountering ? match.awayTeam : match.homeTeam;
        const domPoss   = homeCountering ? awayPoss : homePoss;
        out.push({
          id: `${match.id}-counter-attack`, type: 'explain', priority: 2, icon: '⚡',
          title: `${counter} counter-attacking with less of the ball`,
          subtext: `${dominant} has ${domPoss}% possession but ${counter} has the same or more shots. Classic counter-attack: sit deep, defend in numbers, then explode forward the moment you win the ball back.`,
          match, firedAt: Date.now(), matchMinute: currentMinute,
        });
      }
    }

    if (totalFouls >= 8 && !guard.firedStatKeys.has('physical')) {
      guard.firedStatKeys.add('physical');
      out.push({
        id: `${match.id}-physical`, type: 'explain', priority: 2, icon: '💪',
        title: `${totalFouls} fouls — this one's getting physical`,
        subtext: `A foul stops play and gives the other team a free kick. Near the penalty box, that's nearly as dangerous as a corner. When fouls pile up, one team is winning the physical battle — or getting desperate.`,
        match, firedAt: Date.now(), matchMinute: currentMinute,
      });
    }

    if (totalYellow >= 4 && !guard.firedStatKeys.has('yellow-wave')) {
      guard.firedStatKeys.add('yellow-wave');
      out.push({
        id: `${match.id}-yellow-wave`, type: 'explain', priority: 2, icon: '🟨',
        title: `${totalYellow} yellow cards — players on the edge`,
        subtext: `With this many yellows, some players are one foul away from a red card (sent off). Teams often substitute booked players to protect a man advantage for the rest of the match.`,
        match, firedAt: Date.now(), matchMinute: currentMinute,
      });
    }
  }

  // ── LAYER 4: TENSION BAND CROSSINGS ──────────────────────────────────────

  if (isLive && guard.prevExScore !== null) {
    const CROSSINGS = [
      {
        key: 'tense', min: 60, icon: '🔥', title: 'The match is getting tense',
        sub: () => {
          const ctx = hs === as_
            ? `Level at ${hs}–${as_} — a goal now changes everything.`
            : `${hs > as_ ? match.homeTeam : match.awayTeam} lead, but no lead is safe in soccer.`;
          return `${ctx} Clock pressure, attacking patterns, and score situation are all elevated right now.`;
        },
      },
      {
        key: 'high_alert', min: 75, icon: '⚡', title: 'Final stretch — maximum pressure',
        sub: () => `This is when World Cup games are decided. Tired legs, tactical changes, set pieces in dangerous areas — everything that's been building is coming to a head.`,
      },
    ];
    for (const c of CROSSINGS) {
      if (guard.prevExScore < c.min && ex.score >= c.min) {
        const lastFired = guard.firedBands[c.key] ?? 0;
        if (Date.now() - lastFired > BAND_COOLDOWN_MS) {
          guard.firedBands[c.key] = Date.now();
          out.push({
            id: `${match.id}-${c.key}-${Date.now()}`, type: 'tension', priority: 4,
            icon: c.icon, title: c.title, subtext: c.sub(),
            match, firedAt: Date.now(), matchMinute: currentMinute,
          });
        }
      }
    }
  }

  return out;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_COLORS = {
  beat:      '#06b6d4',  // cyan — match beats (kickoff, 2nd half, FT)
  milestone: '#6366f1',  // indigo — clock check-ins
  explain:   '#a78bfa',  // purple — stat explainers
  tension:   '#f59e0b',  // amber — excitement crossings
  post:      '#22c55e',  // green — full time
};

const TYPE_LABELS = {
  beat:      'match',
  milestone: 'check-in',
  explain:   'explain it',
  tension:   'tension',
  post:      'full time',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LivePulse() {
  const { matches }  = useMatches();
  const today        = useMemo(makeTodayStr, []);
  const todayMatches = useMemo(() => matches.filter(m => m.date === today), [matches, today]);

  const [espnMap,         setEspnMap]         = useState({});
  const [summaryMap,      setSummaryMap]       = useState({});
  const [exMap,           setExMap]           = useState({});
  const [notifLog,        setNotifLog]         = useState([]);
  const [toastStack,      setToastStack]       = useState([]);
  const [lastPoll,        setLastPoll]         = useState(null);
  const [pollCount,       setPollCount]        = useState(0);
  const [selectedMatchId, setSelectedMatchId]  = useState(null);
  const [selectedCardId,  setSelectedCardId]   = useState(null);
  const [adminOpen,       setAdminOpen]        = useState(false);

  const guardsRef          = useRef({});
  const selectedMatchIdRef = useRef(null);
  const [, tick_]          = useState(0);

  useEffect(() => {
    selectedMatchIdRef.current = selectedMatchId;
  }, [selectedMatchId]);

  // Relative-time refresh
  useEffect(() => {
    const id = setInterval(() => tick_(n => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  // Auto-select live match
  useEffect(() => {
    const live = todayMatches.find(m => espnMap[m.id]?.state === 'in');
    if (live) {
      setSelectedMatchId(live.id);
    } else if (!selectedMatchIdRef.current && todayMatches.length > 0) {
      setSelectedMatchId(todayMatches[0].id);
    }
  }, [espnMap, todayMatches]);

  // Persistent toast stack
  const dismissToast = useCallback((id) => {
    setToastStack(prev => prev.filter(t => t.id !== id));
  }, []);

  function pushToasts(notifs) {
    setToastStack(prev => {
      const next = [...notifs.slice().reverse(), ...prev];
      return next.slice(0, 8);
    });
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
              initialized: false, prevExScore: null,
              prevEspnState: null, prevPeriod: null,
              firedBands: {}, firedStatKeys: new Set(), firedPost: false,
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

          // Auto-select the newest high-priority card for the currently viewed match
          const forSelected = newNotifs.filter(n => n.match.id === selectedMatchIdRef.current);
          if (forSelected.length) {
            const top = [...forSelected].sort((a, b) => b.priority - a.priority)[0];
            setSelectedCardId(top.id);
          }
        }
      } catch { /* fail soft */ }
    };

    runTick();
    const id = setInterval(runTick, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, todayMatches]);

  // ── Derived values for selected match ─────────────────────────────────────
  const selectedMatch  = todayMatches.find(m => m.id === selectedMatchId) ?? null;
  const selectedEspn   = selectedMatch ? espnMap[selectedMatch.id] : null;
  const selectedSummary = selectedMatch ? summaryMap[selectedMatch.id] : null;
  const selectedEx     = selectedMatch ? exMap[selectedMatch.id] : null;
  const isSelectedLive = selectedEspn?.state === 'in';
  const isSelectedPost = selectedEspn?.state === 'post';
  const currentMinute  = parseMinute(selectedEspn?.clock) ?? null;

  // Cards for selected match, sorted chronologically by matchMinute
  const selectedMatchCards = useMemo(
    () => notifLog
      .filter(n => n.match.id === selectedMatchId)
      .slice()
      .sort((a, b) => (a.matchMinute ?? 0) - (b.matchMinute ?? 0)),
    [notifLog, selectedMatchId],
  );

  const selectedCard = selectedMatchCards.find(c => c.id === selectedCardId) ?? null;

  // Timeline progress (0-100)
  const timelineProgress = isSelectedPost
    ? 100
    : isSelectedLive && currentMinute != null
      ? Math.min((currentMinute / 90) * 100, 99)
      : 0;

  const toggleCard = useCallback((id) => {
    setSelectedCardId(prev => prev === id ? null : id);
  }, []);

  return (
    <div className="pulse-page">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="pulse-header">
        <Link to="/" className="pulse-back">← Cup Radar</Link>
        <div style={{ flex: 1 }}>
          <h1 className="pulse-title">Live Pulse <span className="pulse-test-badge">TEST</span></h1>
          <p className="pulse-desc">
            Game-teaching notifications · ESPN polls every 30s
            {lastPoll && <span className="pulse-last-poll"> · {relTime(lastPoll)} (#{pollCount})</span>}
          </p>
        </div>
      </div>

      {/* ── Match tabs ─────────────────────────────────────────────────────── */}
      {todayMatches.length > 0 && (
        <div className="pulse-tabs">
          {todayMatches.map(m => {
            const espn   = espnMap[m.id];
            const isLive = espn?.state === 'in';
            const isPost = espn?.state === 'post' || m.status === 'finished';
            const cardCount = notifLog.filter(n => n.match.id === m.id).length;
            return (
              <button
                key={m.id}
                className={`pulse-tab${selectedMatchId === m.id ? ' active' : ''}${isLive ? ' live' : ''}`}
                onClick={() => setSelectedMatchId(m.id)}
              >
                <span className="pulse-tab__teams">
                  {isLive && <span className="pulse-tab__dot" />}
                  {m.homeTeam} vs {m.awayTeam}
                </span>
                <span className="pulse-tab__sub">
                  {isLive ? espn.clock
                    : isPost ? 'FT'
                    : `${m.time} ${m.timezone}`}
                  {cardCount > 0 && <span className="pulse-tab__count">{cardCount}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Selected match view ─────────────────────────────────────────────── */}
      {selectedMatch && (
        <div className="pulse-match-view">

          {/* Score bar */}
          <div className="pulse-score-bar">
            <div className="pulse-score-bar__team">
              <FlagImg emoji={selectedMatch.homeFlag} size={22} />
              <span>{selectedMatch.homeTeam}</span>
            </div>
            <div className="pulse-score-bar__center">
              <span className="pulse-score-bar__score">
                {isSelectedLive || isSelectedPost
                  ? `${selectedEspn?.homeScore ?? '–'} – ${selectedEspn?.awayScore ?? '–'}`
                  : 'vs'}
              </span>
              <span className="pulse-score-bar__status">
                {isSelectedLive
                  ? <><span className="pulse-score-bar__live-dot" />{selectedEspn.clock}</>
                  : isSelectedPost ? 'Full Time'
                  : `${selectedMatch.time} ${selectedMatch.timezone}`}
              </span>
            </div>
            <div className="pulse-score-bar__team pulse-score-bar__team--away">
              <span>{selectedMatch.awayTeam}</span>
              <FlagImg emoji={selectedMatch.awayFlag} size={22} />
            </div>
          </div>

          {/* Timeline */}
          <div className="pulse-timeline">
            <div className="pulse-timeline__track">
              {/* Fill */}
              <div className="pulse-timeline__fill" style={{ width: `${timelineProgress}%` }} />

              {/* Halftime marker */}
              <div className="pulse-timeline__ht" style={{ left: '50%' }}>
                <span className="pulse-timeline__ht-label">HT</span>
              </div>

              {/* Live cursor */}
              {isSelectedLive && currentMinute != null && (
                <div className="pulse-timeline__cursor" style={{ left: `${timelineProgress}%` }}>
                  <span className="pulse-timeline__cursor-label">{currentMinute}&apos;</span>
                </div>
              )}

              {/* Notification dots */}
              {selectedMatchCards.map((card, idx) => {
                const min = card.matchMinute ?? 0;
                const pos = Math.max(0.5, Math.min((min / 90) * 100, 98.5));
                // Stagger overlapping dots vertically
                const nearbyCount = selectedMatchCards
                  .slice(0, idx)
                  .filter(c => Math.abs((c.matchMinute ?? 0) - min) < 4).length;
                const topOffset = nearbyCount % 2 === 0 ? -18 : 8;
                return (
                  <button
                    key={card.id}
                    className={`pulse-timeline__dot${selectedCardId === card.id ? ' selected' : ''}`}
                    style={{ left: `${pos}%`, top: `calc(50% + ${topOffset}px)` }}
                    onClick={() => toggleCard(card.id)}
                    title={`${min}' — ${card.title}`}
                    aria-pressed={selectedCardId === card.id}
                  >
                    {card.icon}
                  </button>
                );
              })}
            </div>

            <div className="pulse-timeline__labels">
              <span>0&apos;</span>
              <span>45&apos;</span>
              <span>90&apos;</span>
            </div>
          </div>

          {/* Selected card detail */}
          {selectedCard && (
            <div className={`pulse-detail pulse-detail--${selectedCard.type}`}>
              <span className="pulse-detail__icon">{selectedCard.icon}</span>
              <div className="pulse-detail__body">
                <div className="pulse-detail__meta-top">
                  {selectedCard.matchMinute != null && (
                    <span className="pulse-detail__min">{selectedCard.matchMinute}&apos;</span>
                  )}
                  <span
                    className="pulse-notif__type"
                    style={{ background: TYPE_COLORS[selectedCard.type] ?? '#888' }}
                  >{TYPE_LABELS[selectedCard.type] ?? selectedCard.type}</span>
                </div>
                <div className="pulse-detail__title">{selectedCard.title}</div>
                <div className="pulse-detail__sub">{selectedCard.subtext}</div>
              </div>
              <button
                className="pulse-detail__close"
                aria-label="Close card"
                onClick={() => setSelectedCardId(null)}
              >×</button>
            </div>
          )}

          {/* Card list — chronological, selectable */}
          {selectedMatchCards.length === 0 ? (
            <div className="pulse-feed-empty" style={{ margin: '0 0 0' }}>
              <p>No cards yet for this match.</p>
              <p className="pulse-feed-empty__sub">
                Cards begin on the second ESPN poll (~30s after load). Guaranteed cards:
                kick-off · possession · 10/20/30/40 min milestones · 2nd half · 60/70/80 min milestones · full time.
              </p>
            </div>
          ) : (
            <div className="pulse-card-list">
              {selectedMatchCards.map(card => (
                <button
                  key={card.id}
                  className={`pulse-card-item${selectedCardId === card.id ? ' selected' : ''}`}
                  onClick={() => toggleCard(card.id)}
                >
                  <span className="pulse-card-item__min">
                    {card.matchMinute != null ? `${card.matchMinute}'` : '–'}
                  </span>
                  <span className="pulse-card-item__icon">{card.icon}</span>
                  <div className="pulse-card-item__text">
                    <span className="pulse-card-item__title">{card.title}</span>
                    {selectedCardId === card.id && (
                      <span className="pulse-card-item__sub">{card.subtext}</span>
                    )}
                  </div>
                  <span
                    className="pulse-card-item__badge"
                    style={{ background: TYPE_COLORS[card.type] ?? '#888' }}
                  >{TYPE_LABELS[card.type] ?? card.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Admin panel — live match only ────────────────────────────────────── */}
      <div className="pulse-admin" style={{ maxWidth: 1100, margin: '16px auto 0', padding: '0 24px' }}>
        <button className="pulse-admin__toggle" onClick={() => setAdminOpen(o => !o)}>
          {adminOpen ? '▾' : '▸'} Admin — raw data for current game
        </button>

        {adminOpen && (() => {
          const live = todayMatches.find(m => espnMap[m.id]?.state === 'in')
            ?? todayMatches.find(m => espnMap[m.id]?.state === 'post')
            ?? todayMatches[0];
          if (!live) return <p className="pulse-admin__null">No match data yet.</p>;
          const espn  = espnMap[live.id];
          const stats = summaryMap[live.id]?.stats;
          const ex    = exMap[live.id];
          const guard = guardsRef.current[live.id];
          return (
            <div className="pulse-admin__grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              <div className="pulse-admin__card">
                <div className="pulse-admin__card-title">{live.homeTeam} vs {live.awayTeam}</div>
                <div className="pulse-admin__section">ESPN</div>
                {espn
                  ? <pre className="pulse-admin__pre">{JSON.stringify({ state: espn.state, clock: espn.clock, period: espn.period, score: `${espn.homeScore}–${espn.awayScore}` }, null, 2)}</pre>
                  : <p className="pulse-admin__null">no data</p>}
              </div>
              <div className="pulse-admin__card">
                <div className="pulse-admin__card-title">Excitement</div>
                {ex
                  ? <pre className="pulse-admin__pre">{JSON.stringify({ score: ex.score, band: ex.label, scorePressure: pct(ex.components?.scorePressure), clockLeverage: pct(ex.components?.clockLeverage), attackPressure: pct(ex.components?.attackPressure), chaosBonus: pct(ex.components?.chaosBonus), finishBonus: pct(ex.components?.finishBonus) }, null, 2)}</pre>
                  : <p className="pulse-admin__null">not computed</p>}
              </div>
              <div className="pulse-admin__card">
                <div className="pulse-admin__card-title">Stats</div>
                {stats
                  ? <pre className="pulse-admin__pre">{JSON.stringify({ shots: `${stats.homeShots||0}–${stats.awayShots||0}`, onTarget: `${stats.homeShotsOnTarget||0}–${stats.awayShotsOnTarget||0}`, possession: `${stats.homePossession||0}%–${stats.awayPossession||0}%`, corners: `${stats.homeCorners||0}–${stats.awayCorners||0}`, yellows: `${stats.homeYellow||0}–${stats.awayYellow||0}`, fouls: `${stats.homeFouls||0}–${stats.awayFouls||0}` }, null, 2)}</pre>
                  : <p className="pulse-admin__null">no summary</p>}
              </div>
              <div className="pulse-admin__card">
                <div className="pulse-admin__card-title">Guard state</div>
                {guard
                  ? <pre className="pulse-admin__pre">{JSON.stringify({ initialized: guard.initialized, prevExScore: guard.prevExScore, prevState: guard.prevEspnState, firedPost: guard.firedPost, firedBands: Object.keys(guard.firedBands), firedStatKeys: [...guard.firedStatKeys] }, null, 2)}</pre>
                  : <p className="pulse-admin__null">not initialized</p>}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Persistent toast stack ───────────────────────────────────────────── */}
      {toastStack.length > 0 && (
        <div className="pulse-toast-stack" role="log" aria-live="polite">
          {toastStack.map(n => (
            <div key={n.id} className={`pulse-toast pulse-toast--${n.type}`}>
              <span className="pulse-toast__icon">{n.icon}</span>
              <div className="pulse-toast__body">
                <div className="pulse-toast__title">{n.title}</div>
                <div className="pulse-toast__sub">{n.subtext}</div>
                <div className="pulse-toast__meta">
                  <span className="pulse-notif__type" style={{ background: TYPE_COLORS[n.type] ?? '#888' }}>
                    {TYPE_LABELS[n.type] ?? n.type}
                  </span>
                  <span className="pulse-toast__time">{relTime(n.firedAt)}</span>
                </div>
              </div>
              <button className="pulse-toast__dismiss" aria-label="Dismiss" onClick={() => dismissToast(n.id)}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
