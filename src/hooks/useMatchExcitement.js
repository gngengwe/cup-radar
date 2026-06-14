// ─── useMatchExcitement — live excitement score + badges for a match ──────
// MVP: computed only while espn.state === 'in'. Keeps a rolling history of
// score snapshots (capped) for lead-swing detection, and a sustain-tick
// counter so "Goal Right Here" only fires once the score has stayed at/above
// threshold for a couple of polls (~60s at the existing 30s cadence).

import { useRef, useMemo } from 'react';
import { computeMatchExcitement } from '../utils/matchExcitementEngine';
import { evaluateMatchBadges } from '../utils/matchBadgeEngine';
import { EXCITEMENT_HISTORY_CAP, GOAL_RIGHT_HERE_THRESHOLD } from '../config/matchExcitementWeights';

const EMPTY_BADGES = { dominant: null, secondary: [] };

export function useMatchExcitement(match, espn) {
  const historyRef = useRef([]);
  const sustainRef = useRef(0);

  return useMemo(() => {
    if (!espn || espn.state !== 'in') {
      historyRef.current = [];
      sustainRef.current = 0;
      return { excitement: null, badges: EMPTY_BADGES };
    }

    const history = historyRef.current;
    const last = history[history.length - 1];
    if (!last || last.homeScore !== espn.homeScore || last.awayScore !== espn.awayScore) {
      history.push({ homeScore: espn.homeScore, awayScore: espn.awayScore });
      if (history.length > EXCITEMENT_HISTORY_CAP) history.shift();
    }

    const excitement = computeMatchExcitement(match, espn, history);

    sustainRef.current = excitement.score >= GOAL_RIGHT_HERE_THRESHOLD
      ? sustainRef.current + 1
      : 0;

    const badges = evaluateMatchBadges(match, espn, excitement, sustainRef.current);

    return { excitement, badges };
  }, [match, espn?.state, espn?.clock, espn?.period, espn?.homeScore, espn?.awayScore]);
}
