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

  const beforeLevel = goal.homeScoreBefore === goal.awayScoreBefore;
  const afterLevel = goal.homeScoreAfter === goal.awayScoreAfter;
  const scoringSide = goal.team === goal.homeTeam ? 'home' : 'away';
  const wasTrailing = scoringSide === 'home'
    ? goal.homeScoreBefore < goal.awayScoreBefore
    : goal.awayScoreBefore < goal.homeScoreBefore;

  if (afterLevel) {
    return `${goal.player} levels it at ${goal.homeScoreAfter}-${goal.awayScoreAfter}.`;
  }

  if (beforeLevel) {
    return `${goal.player} puts ${goal.team} ahead ${goal.homeScoreAfter}-${goal.awayScoreAfter}.`;
  }

  if (wasTrailing) {
    return `${goal.player} pulls ${goal.team} back into it at ${goal.homeScoreAfter}-${goal.awayScoreAfter}.`;
  }

  return `${goal.player} makes it ${goal.homeScoreAfter}-${goal.awayScoreAfter} for ${goal.team}.`;
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
  const note = goal.isOwnGoal ? ' (own goal)' : '';
  return `${goal.player}${note} ${goal.minute}' - ${goal.homeTeam} ${goal.homeScoreAfter}-${goal.awayScoreAfter} ${goal.awayTeam} in ${goal.city}`;
}
