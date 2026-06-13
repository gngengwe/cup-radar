import { useState } from 'react';
import { useParams } from 'react-router-dom';
import newsData from '../data/news.json';
import { relativeTime } from '../utils/time';
import { getCityMeta, CITY_NEWS_CATS } from '../utils/cityConfig';

const CAT_COLORS = {
  tournament:  { color: 'var(--accent)',  bg: 'var(--accent-soft)' },
  general:     { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' },
  seattle:     { color: '#4d8eff',        bg: 'var(--blue-soft)' },
  kansascity:  { color: '#c084fc',        bg: 'rgba(192,132,252,0.1)' },
  miami:       { color: '#f43f5e',        bg: 'rgba(244,63,94,0.1)' },
  newyork:     { color: '#3b82f6',        bg: 'rgba(59,130,246,0.1)' },
  philly:      { color: '#10b981',        bg: 'rgba(16,185,129,0.1)' },
  atlanta:     { color: '#fb923c',        bg: 'rgba(251,146,60,0.1)' },
  vancouver:   { color: '#22d3ee',        bg: 'rgba(34,211,238,0.1)' },
  losangeles:  { color: '#facc15',        bg: 'rgba(250,204,21,0.1)' },
  tickets:     { color: '#ffb84d',        bg: 'rgba(255,184,77,0.1)' },
  teams:       { color: '#a78bfa',        bg: 'rgba(167,139,250,0.1)' },
  travel:      { color: '#34d399',        bg: 'rgba(52,211,153,0.1)' },
  culture:     { color: '#f472b6',        bg: 'rgba(244,114,182,0.1)' },
};

const CAT_LABELS = {
  all:        'All',
  tournament: 'Tournament',
  general:    'General',
  seattle:    '🏟️ Seattle',
  kansascity: '🏈 Kansas City',
  miami:      '🌴 Miami',
  newyork:    '🗽 New York',
  philly:     '🦅 Philadelphia',
  atlanta:    '🍑 Atlanta',
  vancouver:  '🍁 Vancouver',
  losangeles: '🎬 Los Angeles',
  tickets:    'Tickets',
  teams:      'Teams',
  travel:     'Travel',
  culture:    'Culture',
};

// Non-city categories always shown
const GENERAL_CATS = ['all', 'tournament', 'general', 'tickets', 'teams', 'travel', 'culture'];

function NewsCard({ article, featured }) {
  const cfg = CAT_COLORS[article.category] || { color: 'var(--text-muted)', bg: 'rgba(255,255,255,.05)' };
  return (
    <div className={`news-card${featured ? ' featured' : ''}`}>
      <div className="news-card__top">
        <span className="news-card__cat" style={{ color: cfg.color, background: cfg.bg }}>
          {CAT_LABELS[article.category] || article.category}
        </span>
        <span className="news-card__date" title={article.date}>{relativeTime(article.date)}</span>
      </div>
      <div className="news-card__headline">{article.headline}</div>
      <div className="news-card__summary">{article.summary}</div>
      <div className="news-card__source">— {article.source}</div>
      {article.link && (
        <a href={article.link} className="news-card__link" target="_blank" rel="noopener noreferrer">
          Read more ↗
        </a>
      )}
    </div>
  );
}

export default function Newsroom() {
  const { city = 'seattle' } = useParams();
  const cityMeta = getCityMeta(city);
  const cityNewsCat = cityMeta.newsCategory;

  // Show city-specific chip + general chips
  const CATEGORIES = [
    ...GENERAL_CATS.slice(0, 1),       // 'all'
    cityNewsCat,                        // current city
    ...GENERAL_CATS.slice(1),          // tournament, tickets, teams, travel, culture
  ];

  const [cat, setCat] = useState(cityNewsCat);
  const { articles, lastUpdated } = newsData;

  // In "all" view: show current city's news + general categories; exclude other cities
  const filtered = (() => {
    if (cat === 'all') return articles.filter(a =>
      !CITY_NEWS_CATS.has(a.category) || a.category === cityNewsCat
    );
    return articles.filter(a => a.category === cat);
  })();

  const featured = filtered.filter(a => a.featured && !a.draft && !a.archived);
  const rest     = filtered.filter(a => !a.featured && !a.draft && !a.archived);

  const updatedStr = new Date(lastUpdated).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">Newsroom</h2>
        <span className="dash-last-updated">Updated {updatedStr}</span>
      </div>

      <div className="filter-bar">
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`filter-chip${cat === c ? ' active' : ''}`}
            onClick={() => setCat(c)}
          >
            {CAT_LABELS[c] || c}
          </button>
        ))}
      </div>

      {featured.length > 0 && (
        <div className="news-featured">
          {featured.map(a => <NewsCard key={a.id} article={a} featured />)}
        </div>
      )}

      <div className="news-grid">
        {rest.map(a => <NewsCard key={a.id} article={a} featured={false} />)}
        {filtered.length === 0 && (
          <div className="empty-state">No stories in this category yet.</div>
        )}
      </div>

      <p className="dash-disclaimer">
        Cup Radar curates news manually. Articles are summaries only.
        Cup Radar is not affiliated with FIFA.
      </p>
    </div>
  );
}
