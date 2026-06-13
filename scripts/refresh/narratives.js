import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '../../src/data');

function parseRss(xml) {
  const items = [];
  const rx = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = rx.exec(xml)) !== null) {
    const b   = m[1];
    const get = tag => {
      const r = b.match(new RegExp(
        `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`
      ));
      return r ? (r[1] ?? r[2] ?? '').trim() : '';
    };
    const title = get('title').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"');
    const link  = get('link') || get('guid');
    const pub   = get('pubDate');
    if (title && link) items.push({ title, link, pub });
  }
  return items;
}

// Map narrative teams to search keywords
const NARRATIVE_KEYWORDS = {
  'ARG': 'Messi Argentina 2026',
  'FRA': 'Mbappe France World Cup 2026',
  'BRA': 'Brazil World Cup 2026',
  'ENG': 'England World Cup 2026',
  'ESP': 'Spain World Cup 2026',
  'GER': 'Germany World Cup 2026',
  'POR': 'Ronaldo Portugal World Cup 2026',
  'USA': 'USMNT World Cup 2026',
};

// Auto-promote a narrative from "pre-tournament" to "building" once its
// storyline has actually started — either one of its teams has played a
// finished match, or (for team-less storylines like the format narrative)
// the tournament has kicked off at all. Later stages (climax/resolved) stay
// editorial calls made in the Admin Panel.
function bumpStatuses(current, matches) {
  const playedTeams = new Set();
  for (const m of matches) {
    if (m.status === 'finished') {
      playedTeams.add(m.homeCode);
      playedTeams.add(m.awayCode);
    }
  }
  const tournamentStarted = playedTeams.size > 0;
  const bumped = [];

  for (const narrative of current.narratives) {
    if (narrative.status !== 'pre-tournament') continue;
    const teams = narrative.teams || [];
    const hasStarted = teams.length > 0
      ? teams.some(t => playedTeams.has(t))
      : tournamentStarted;
    if (hasStarted) {
      narrative.status = 'building';
      bumped.push(narrative.title || narrative.id);
    }
  }
  return bumped;
}

export async function refreshNarratives() {
  console.log('[narratives] checking for new chapters via news search…');

  const summary = { vertical: 'narratives', applied: [], pending: [], flags: [] };

  const file    = join(DATA, 'narratives.json');
  const current = JSON.parse(readFileSync(file, 'utf8'));

  const matchesFile = join(DATA, 'matches.json');
  const matches     = JSON.parse(readFileSync(matchesFile, 'utf8'));
  const bumped      = bumpStatuses(current, Array.isArray(matches) ? matches : matches.matches || []);
  for (const title of bumped) {
    summary.applied.push(`"${title}" moved pre-tournament → building`);
  }

  let addedChapters = 0;

  for (const narrative of current.narratives) {
    // Build search query from teams
    const keyword = narrative.teams
      .map(t => NARRATIVE_KEYWORDS[t])
      .find(Boolean);
    if (!keyword) continue;

    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en-US&gl=US&ceid=US:en`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'CupRadarBot/1.0' } });
      if (!res.ok) continue;

      const items    = parseRss(await res.text()).slice(0, 5);
      const existing = new Set((narrative.chapters || []).map(c => c.sourceLink).filter(Boolean));

      for (const item of items) {
        if (existing.has(item.link)) continue;

        const dateStr = (() => {
          try { return new Date(item.pub).toISOString().split('T')[0]; }
          catch { return new Date().toISOString().split('T')[0]; }
        })();

        // Only add if recent (last 30 days)
        const age = (Date.now() - new Date(dateStr)) / 86400000;
        if (age > 30) continue;

        narrative.chapters = narrative.chapters || [];
        narrative.chapters.push({
          id:         `ch-auto-${narrative.id}-${Date.now()}`,
          date:       dateStr,
          title:      item.title,
          body:       '',          // admin fills in the narrative body
          sourceLink: item.link,
          draft:      true,        // requires admin review before publishing
        });
        narrative.chapterCount = narrative.chapters.length;
        existing.add(item.link);
        addedChapters++;
        summary.pending.push(`"${item.title}" — chapter for "${narrative.title || narrative.id}" needs a body written — [source](${item.link})`);
      }
    } catch (err) {
      console.log(`[narratives] ${narrative.id} failed: ${err.message}`);
      summary.flags.push(`${narrative.id}: search failed — ${err.message}`);
    }
  }

  if (addedChapters > 0 || bumped.length > 0) {
    current.lastUpdated = new Date().toISOString();
    writeFileSync(file, JSON.stringify(current, null, 2) + '\n');
    console.log(`[narratives] added ${addedChapters} draft chapters, bumped ${bumped.length} statuses`);
  } else {
    console.log('[narratives] no new chapters or status changes');
  }

  return summary;
}
