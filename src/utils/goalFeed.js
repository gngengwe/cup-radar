// Flattens matches.json into a chronological feed of individual goals,
// for the Goal Radar map + montage. Only matches the auto-refresh bot has
// backfilled with a `goals` array contribute entries — the feed grows as
// the tournament progresses.
import matchesData from '../data/matches.json';
import { normalizeCity } from '../data/venueCoords';

function minuteValue(minute) {
  const m = String(minute).match(/^(\d+)(?:\+(\d+))?/);
  if (!m) return 0;
  return Number(m[1]) + (m[2] ? Number(m[2]) / 100 : 0);
}

export function getGoalFeed() {
  const feed = [];
  for (const m of matchesData.matches) {
    if (!m.goals?.length) continue;
    const goals = [...m.goals].sort((a, b) => minuteValue(a.minute) - minuteValue(b.minute));
    let homeRunning = 0;
    let awayRunning = 0;

    goals.forEach((g, goalIndex) => {
      const isHome = g.team === 'home';
      const scoreBeforeHome = homeRunning;
      const scoreBeforeAway = awayRunning;

      if (isHome) homeRunning += 1;
      else awayRunning += 1;

      feed.push({
        id:       `${m.id}-${g.minute}-${g.player}`,
        matchId:  m.id,
        date:     m.date,
        minute:   g.minute,
        player:   g.player,
        note:     g.note,
        isOwnGoal: g.note === 'og',
        team:     isHome ? m.homeTeam : m.awayTeam,
        teamCode: isHome ? m.homeCode : m.awayCode,
        flag:     isHome ? m.homeFlag : m.awayFlag,
        opponent: isHome ? m.awayTeam : m.homeTeam,
        opponentCode: isHome ? m.awayCode : m.homeCode,
        homeTeam: m.homeTeam,
        homeCode: m.homeCode,
        awayTeam: m.awayTeam,
        awayCode: m.awayCode,
        homeFlag: m.homeFlag,
        awayFlag: m.awayFlag,
        homeScoreFinal: m.homeScore,
        awayScoreFinal: m.awayScore,
        homeScoreBefore: scoreBeforeHome,
        awayScoreBefore: scoreBeforeAway,
        homeScoreAfter: homeRunning,
        awayScoreAfter: awayRunning,
        goalNumberInMatch: goalIndex + 1,
        matchGoalCount: goals.length,
        city:     m.city,
        venueKey: normalizeCity(m.city),
        venue:    m.venue,
        group:    m.group,
        stage:    m.stage,
        status:   m.status,
      });
    });
  }
  feed.sort((a, b) => a.date.localeCompare(b.date) || minuteValue(a.minute) - minuteValue(b.minute));
  feed.forEach((goal, index) => {
    goal.sequence = index + 1;
  });
  return feed;
}

export function getCityGoalCounts(feed) {
  const counts = {};
  for (const g of feed) counts[g.venueKey] = (counts[g.venueKey] || 0) + 1;
  return counts;
}
