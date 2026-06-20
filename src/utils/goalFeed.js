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
    for (const g of m.goals) {
      const isHome = g.team === 'home';
      feed.push({
        id:       `${m.id}-${g.minute}-${g.player}`,
        matchId:  m.id,
        date:     m.date,
        minute:   g.minute,
        player:   g.player,
        note:     g.note,
        team:     isHome ? m.homeTeam : m.awayTeam,
        flag:     isHome ? m.homeFlag : m.awayFlag,
        opponent: isHome ? m.awayTeam : m.homeTeam,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeFlag: m.homeFlag,
        awayFlag: m.awayFlag,
        city:     m.city,
        venueKey: normalizeCity(m.city),
        venue:    m.venue,
        group:    m.group,
        stage:    m.stage,
      });
    }
  }
  feed.sort((a, b) => a.date.localeCompare(b.date) || minuteValue(a.minute) - minuteValue(b.minute));
  return feed;
}

export function getCityGoalCounts(feed) {
  const counts = {};
  for (const g of feed) counts[g.venueKey] = (counts[g.venueKey] || 0) + 1;
  return counts;
}
