import { useMemo } from 'react';
import { computeMatchExcitement } from '../utils/matchExcitementEngine';
import { EXCITEMENT_LABELS } from '../config/matchExcitementWeights';

function minuteVal(minute) {
  const m = String(minute).match(/^(\d+)(?:\+(\d+))?/);
  if (!m) return 0;
  return Number(m[1]) + (m[2] ? Number(m[2]) / 100 : 0);
}

function scoreAt(states, minute) {
  let h = 0, a = 0;
  for (const s of states) {
    if (s.atMinute <= minute) { h = s.homeScore; a = s.awayScore; }
    else break;
  }
  return { homeScore: h, awayScore: a };
}

// Shared replay engine — takes pre-built score states + goal minute markers
function runReplay(match, states, goalMins) {
  const maxMin = Math.max(...goalMins, 90);
  const samples = new Set([
    1, 5, 10, 15, 20, 25, 30, 35, 40, 44,
    46, 50, 55, 60, 65, 70, 75, 80, 85, 88, 90,
    ...goalMins,
    ...goalMins.map(m => m + 0.5),
    ...(maxMin > 90 ? [Math.min(maxMin + 1, 97)] : []),
  ]);

  return [...samples]
    .sort((a, b) => a - b)
    .map(min => {
      const { homeScore, awayScore } = scoreAt(states, min);
      const { score } = computeMatchExcitement(match, {
        state: 'in', homeScore, awayScore,
        clock: `${Math.floor(min)}'`, period: min <= 45 ? 1 : 2,
      }, [], {});
      return { minute: min, score };
    });
}

// Path 1: goals array (preferred — has per-goal minute data)
function buildFromGoals(match) {
  const goals = match?.goals;
  if (!goals?.length) return null;

  const sorted = [...goals].sort((a, b) => minuteVal(a.minute) - minuteVal(b.minute));
  const states = [{ atMinute: 0, homeScore: 0, awayScore: 0 }];
  let h = 0, a = 0;
  for (const g of sorted) {
    if (g.team === 'home') h++; else a++;
    states.push({ atMinute: minuteVal(g.minute), homeScore: h, awayScore: a });
  }
  const goalMins = sorted.map(g => minuteVal(g.minute));
  return { points: runReplay(match, states, goalMins), goalMins };
}

// Path 2: ESPN scoreTimeline fallback (available before bot commits goal data)
function buildFromTimeline(match, timeline) {
  if (!timeline?.length) return null;

  const sorted = timeline
    .filter(t => t.minute != null)
    .sort((a, b) => a.minute - b.minute);

  const states = [
    { atMinute: 0, homeScore: 0, awayScore: 0 },
    ...sorted.map(t => ({ atMinute: t.minute, homeScore: t.homeScore, awayScore: t.awayScore })),
  ];
  const goalMins = sorted.map(t => t.minute);
  return { points: runReplay(match, states, goalMins), goalMins };
}

function bandFor(score) {
  return EXCITEMENT_LABELS.find(b => score >= b.min) || EXCITEMENT_LABELS[EXCITEMENT_LABELS.length - 1];
}

export function ExcitementGraph({ match, livePoints, summary, height = 64 }) {
  const replayResult = useMemo(() => {
    if (livePoints) return null;
    return buildFromGoals(match) || buildFromTimeline(match, summary?.scoreTimeline);
  }, [match, livePoints, summary]);

  const points = livePoints || replayResult?.points;
  if (!points || points.length < 3) return null;

  const isLive = !!livePoints;
  const last   = points[points.length - 1];

  // Goal markers: prefer goals array, fall back to score timeline minutes
  const goalMins = isLive
    ? (match?.goals || []).map(g => minuteVal(g.minute))
    : (replayResult?.goalMins || []);

  // Score annotation
  const peakScore   = Math.max(...points.map(p => p.score));
  const displayScore = isLive ? last.score : peakScore;
  const band         = bandFor(displayScore);

  const W = 300, H = height;
  const maxMin = Math.max(...points.map(p => p.minute), 90);
  const toX = min => (min / maxMin) * W;
  const toY = s   => H - (s / 100) * H;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.minute).toFixed(1)} ${toY(p.score).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${toX(maxMin).toFixed(1)} ${H} L ${toX(0).toFixed(1)} ${H} Z`;

  return (
    <div className="eg">
      {/* Peak score annotation (finished matches only — live has ExcitementMeter) */}
      {!isLive && (
        <div className="eg__peak">
          <span className="eg__peak-score">{peakScore}</span>
          <span className="eg__peak-label">{band.short}</span>
          <span className="eg__peak-tag">peak</span>
        </div>
      )}

      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="eg__svg">
        {/* Halftime divider */}
        <line x1={toX(45)} y1={0} x2={toX(45)} y2={H}
          stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />

        {/* Goal / score-change markers */}
        {goalMins.map((m, i) => (
          <line key={i}
            x1={toX(m).toFixed(1)} y1={0} x2={toX(m).toFixed(1)} y2={H}
            stroke="rgba(34,197,94,0.35)" strokeWidth="0.8" strokeDasharray="2 2" />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="#22c55e" fillOpacity="0.10" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#22c55e" strokeWidth="1.5"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* Live endpoint pulse */}
        {isLive && (
          <circle cx={toX(last.minute).toFixed(1)} cy={toY(last.score).toFixed(1)}
            r="3" fill="#22c55e" className="eg__live-dot" />
        )}
      </svg>

      <div className="eg__labels">
        <span>0&apos;</span>
        <span className="eg__labels-ht">HT</span>
        <span className={isLive ? 'eg__labels-now' : ''}>{isLive ? `${Math.floor(last.minute)}'` : "90'"}</span>
      </div>
    </div>
  );
}
