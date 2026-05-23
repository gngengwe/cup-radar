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

export async function refreshNarratives() {
  console.log('[narratives] checking for new chapters via news search…');

  const file    = join(DATA, 'narratives.json');
  const current = JSON.parse(readFileSync(file, 'utf8'));

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
      }
    } catch (err) {
      console.log(`[narratives] ${narrative.id} failed: ${err.message}`);
    }
  }

  if (addedChapters > 0) {
    current.lastUpdated = new Date().toISOString();
    writeFileSync(file, JSON.stringify(current, null, 2) + '\n');
    console.log(`[narratives] added ${addedChapters} draft chapters`);
  } else {
    console.log('[narratives] no new chapters found');
  }
}
