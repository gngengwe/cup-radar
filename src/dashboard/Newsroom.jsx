import { useState } from 'react';
import newsData from '../data/news.json';
import { relativeTime } from '../utils/time';

const CATEGORIES = ['all', 'tournament', 'seattle', 'tickets', 'teams', 'travel', 'culture'];

const CAT_COLORS = {
  tournament: { color: 'var(--accent)',    bg: 'var(--accent-soft)' },
  seattle:    { color: '#4d8eff',          bg: 'var(--blue-soft)' },
  tickets:    { color: '#ffb84d',          bg: 'rgba(255,184,77,0.1)' },
  teams:      { color: '#c084fc',          bg: 'rgba(192,132,252,0.1)' },
  travel:     { color: '#34d399',          bg: 'rgba(52,211,153,0.1)' },
  culture:    { color: '#f472b6',          bg: 'rgba(244,114,182,0.1)' },
};

function NewsCard({ article, featured }) {
  const cfg = CAT_COLORS[article.category] || { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' };

  return (
    <div className={`news-card${featured ? ' featured' : ''}`}>
      <div className="news-card__top">
        <span className="news-card__cat" style={{ color: cfg.color, background: cfg.bg }}>
          {article.category}
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
  const [cat, setCat] = useState('all');

  const { articles, lastUpdated } = newsData;

  const filtered = cat === 'all' ? articles : articles.filter(a => a.category === cat);
  const featured = filtered.filter(a => a.featured);
  const rest     = filtered.filter(a => !a.featured);

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
            {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
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
        Cup Radar curates news manually. Articles are summaries only — follow source links for full
        coverage. Cup Radar is not affiliated with FIFA.
      </p>
    </div>
  );
}
