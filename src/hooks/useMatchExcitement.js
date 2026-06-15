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

// When ESPN has no record for this match but the local schedule already
// marks it finished, fall back to a synthetic "post" snapshot from local
// scores so finished-match badges (Upset Alert, Win or Go Home, etc.) still
// evaluate.
function withFinalFallback(match, espn) {
  if (espn) return espn;
  if (match?.status === 'finished') {
    return { state: 'post', homeScore: match.homeScore ?? 0, awayScore: match.awayScore ?? 0, clock: 'FT', period: null };
  }
  return espn;
}

// `summary` is the optional result of normalizeEspnSoccerSummary
// ({ events, scoreTimeline }) — V2 storyline data. Pass undefined/null if
// unavailable; all V2 components and badges degrade to 0/inactive.
export function useMatchExcitement(match, espn, summary) {
  const historyRef = useRef([]);
  const sustainRef = useRef(0);

  const effectiveEspn = withFinalFallback(match, espn);

  return useMemo(() => {
    if (!effectiveEspn || (effectiveEspn.state !== 'in' && effectiveEspn.state !== 'post')) {
      historyRef.current = [];
      sustainRef.current = 0;
      return { excitement: null, badges: EMPTY_BADGES };
    }

    if (effectiveEspn.state === 'post') {
      historyRef.current = [];
      sustainRef.current = 0;
      const excitement = computeMatchExcitement(match, effectiveEspn, [], summary);
      const badges = evaluateMatchBadges(match, effectiveEspn, excitement, 0);
      return { excitement, badges };
    }

    const history = historyRef.current;
    const last = history[history.length - 1];
    if (!last || last.homeScore !== effectiveEspn.homeScore || last.awayScore !== effectiveEspn.awayScore) {
      history.push({ homeScore: effectiveEspn.homeScore, awayScore: effectiveEspn.awayScore });
      if (history.length > EXCITEMENT_HISTORY_CAP) history.shift();
    }

    const excitement = computeMatchExcitement(match, effectiveEspn, history, summary);

    sustainRef.current = excitement.score >= GOAL_RIGHT_HERE_THRESHOLD
      ? sustainRef.current + 1
      : 0;

    const badges = evaluateMatchBadges(match, effectiveEspn, excitement, sustainRef.current);

    return { excitement, badges };
  }, [match, effectiveEspn?.state, effectiveEspn?.clock, effectiveEspn?.period, effectiveEspn?.homeScore, effectiveEspn?.awayScore, summary]);
}
