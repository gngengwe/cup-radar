import { useMemo } from 'react';
import { computeMatchExcitement } from '../utils/matchExcitementEngine';

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

function buildReplayPoints(match) {
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
      const scores = scoreAt(states, min);
      const synEspn = {
        state: 'in',
        homeScore: scores.homeScore,
        awayScore: scores.awayScore,
        clock: `${Math.floor(min)}'`,
        period: min <= 45 ? 1 : 2,
      };
      const { score } = computeMatchExcitement(match, synEspn, [], {});
      return { minute: min, score };
    });
}

export function ExcitementGraph({ match, livePoints, height = 64 }) {
  const replayPoints = useMemo(
    () => (livePoints ? null : buildReplayPoints(match)),
    [match, livePoints],
  );

  const points = livePoints || replayPoints;
  if (!points || points.length < 3) return null;

  const W = 300;
  const H = height;
  const maxMin = Math.max(...points.map(p => p.minute), 90);
  const toX = min => (min / maxMin) * W;
  const toY = s => H - (s / 100) * H;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.minute).toFixed(1)} ${toY(p.score).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${toX(maxMin).toFixed(1)} ${H} L ${toX(0).toFixed(1)} ${H} Z`;

  const goalMins = (match?.goals || []).map(g => minuteVal(g.minute));
  const isLive = !!livePoints;
  const last = points[points.length - 1];

  return (
    <div className="eg">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="eg__svg">
        {/* Halftime divider */}
        <line x1={toX(45)} y1={0} x2={toX(45)} y2={H}
          stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />

        {/* Goal markers */}
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
