import { VENUE_COORDS } from '../data/venueCoords';

export function formatGoalDate(dateStr, options = { weekday: 'short', month: 'short', day: 'numeric' }) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', options);
}

export function getTopCities(cityCounts, limit = 5) {
  return Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, count]) => ({
      key,
      count,
      label: VENUE_COORDS[key]?.label || key,
    }));
}

export function getGoalMomentCopy(goal) {
  if (!goal) return '';

  const isPen = goal.note === 'pen';
  const beforeLevel = goal.homeScoreBefore === goal.awayScoreBefore;
  const afterLevel = goal.homeScoreAfter === goal.awayScoreAfter;
  const scoringSide = goal.team === goal.homeTeam ? 'home' : 'away';
  const wasTrailing = scoringSide === 'home'
    ? goal.homeScoreBefore < goal.awayScoreBefore
    : goal.awayScoreBefore < goal.homeScoreBefore;

  const verb = isPen ? 'converts from the spot to level' : 'levels';
  const putAhead = isPen ? 'steps up and converts from 12 yards' : `puts ${goal.team} ahead`;

  if (afterLevel) {
    return isPen
      ? `${goal.player} converts from the spot — ${goal.homeScoreAfter}-${goal.awayScoreAfter}.`
      : `${goal.player} levels it at ${goal.homeScoreAfter}-${goal.awayScoreAfter}.`;
  }

  if (beforeLevel) {
    return isPen
      ? `${goal.player} steps up and converts — ${goal.team} lead ${goal.homeScoreAfter}-${goal.awayScoreAfter}.`
      : `${goal.player} puts ${goal.team} ahead ${goal.homeScoreAfter}-${goal.awayScoreAfter}.`;
  }

  if (wasTrailing) {
    return isPen
      ? `${goal.player} pulls ${goal.team} back into it from the spot — ${goal.homeScoreAfter}-${goal.awayScoreAfter}.`
      : `${goal.player} pulls ${goal.team} back into it at ${goal.homeScoreAfter}-${goal.awayScoreAfter}.`;
  }

  return isPen
    ? `${goal.player} adds a penalty — ${goal.homeScoreAfter}-${goal.awayScoreAfter} for ${goal.team}.`
    : `${goal.player} makes it ${goal.homeScoreAfter}-${goal.awayScoreAfter} for ${goal.team}.`;
}

export function getCityHeadline(goal, cityCounts) {
  if (!goal) return '';
  const total = cityCounts[goal.venueKey] || 0;
  if (total <= 1) {
    return `${goal.city} is on the board.`;
  }
  return `${goal.city} is up to ${total} goal${total === 1 ? '' : 's'} tracked.`;
}

export function getShareText(goal) {
  if (!goal) return '';
  const note = goal.isOwnGoal ? ' (own goal)' : goal.note === 'pen' ? ' (pen)' : '';
  return `${goal.player}${note} ${goal.minute}' - ${goal.homeTeam} ${goal.homeScoreAfter}-${goal.awayScoreAfter} ${goal.awayTeam} in ${goal.city}`;
}
