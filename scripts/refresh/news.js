import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '../../src/data');

const QUERIES = [
  { q: 'FIFA World Cup 2026',          category: 'general'     },
  { q: 'World Cup 2026 Seattle',        category: 'seattle'     },
  { q: 'World Cup 2026 Kansas City',    category: 'kansascity'  },
  { q: 'World Cup 2026 Lumen Field',    category: 'seattle'     },
  { q: 'World Cup 2026 Arrowhead',      category: 'kansascity'  },
];

function parseRss(xml) {
  const items = [];
  const itemRx = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRx.exec(xml)) !== null) {
    const block = m[1];
    const get = tag => {
      const r = block.match(new RegExp(
        `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`
      ));
      return r ? (r[1] ?? r[2] ?? '').trim() : '';
    };
    const title = get('title').replace(/<[^>]+>/g, '').replace(/&amp;/g,'&').replace(/&quot;/g,'"');
    const link  = get('link') || get('guid');
    const desc  = get('description').replace(/<[^>]+>/g, '').slice(0, 280);
    const pub   = get('pubDate');
    if (title && link) items.push({ title, link, desc, pub });
  }
  return items;
}

function toDateStr(pubDate) {
  try { return new Date(pubDate).toISOString().split('T')[0]; }
  catch { return new Date().toISOString().split('T')[0]; }
}

function slug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
}

export async function refreshNews() {
  console.log('[news] fetching from Google News RSS…');

  const summary = { vertical: 'news', applied: [], pending: [], flags: [] };

  const file    = join(DATA, 'news.json');
  const current = JSON.parse(readFileSync(file, 'utf8'));
  const existingLinks = new Set(current.articles.map(a => a.link).filter(Boolean));

  const fresh = [];

  for (const { q, category } of QUERIES) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'CupRadarBot/1.0' } });
      if (!res.ok) { console.log(`[news] ${q} → HTTP ${res.status}`); continue; }
      const xml   = await res.text();
      const items = parseRss(xml);

      for (const item of items.slice(0, 8)) {
        if (existingLinks.has(item.link)) continue;
        // Filter — must mention 2026 or WC
        if (!/2026|world.?cup|fifa|wc26/i.test(item.title + item.desc)) continue;

        const dateStr = toDateStr(item.pub);
        fresh.push({
          id:       `news-auto-${slug(item.title)}-${dateStr}`,
          headline: item.title,
          summary:  item.desc || item.title,
          category,
          source:   'Auto-refresh',
          date:     dateStr,
          link:     item.link,
          featured: false,
          draft:    true,   // admin must review before it goes live
        });
        existingLinks.add(item.link);
      }
    } catch (err) {
      console.log(`[news] ${q} failed: ${err.message}`);
    }
  }

  if (fresh.length === 0) { console.log('[news] no new articles'); return summary; }

  // Prepend fresh articles (newest first), keep max 100 total
  current.articles = [...fresh, ...current.articles].slice(0, 100);
  current.lastUpdated = new Date().toISOString();
  writeFileSync(file, JSON.stringify(current, null, 2) + '\n');
  console.log(`[news] added ${fresh.length} draft articles`);

  for (const a of fresh) {
    summary.pending.push(`"${a.headline}" (${a.category}) — [source](${a.link})`);
  }

  return summary;
}
