import { useState, useEffect } from 'react';
import { fetchFile, saveFile } from '../utils/github';

const CATEGORIES = ['tournament', 'seattle', 'kansascity', 'tickets', 'teams', 'travel', 'culture'];

const BLANK = () => ({
  id:       `news-${Date.now()}`,
  headline: '',
  summary:  '',
  category: 'tournament',
  source:   'Cup Radar',
  date:     new Date().toISOString().split('T')[0],
  link:     null,
  featured: false,
});

export default function NewsEditor({ token }) {
  const [data,       setData]       = useState(null);
  const [sha,        setSha]        = useState('');
  const [article,    setArticle]    = useState(BLANK);
  const [saving,     setSaving]     = useState(false);
  const [status,     setStatus]     = useState('');
  const [error,      setError]      = useState('');
  const [deleteId,   setDeleteId]   = useState('');

  useEffect(() => {
    fetchFile(token, 'src/data/news.json')
      .then(({ content, sha }) => { setData(content); setSha(sha); })
      .catch(e => setError(e.message));
  }, [token]);

  const set = (field, val) => setArticle(a => ({ ...a, [field]: val }));

  const saveNew = async () => {
    if (!article.headline.trim() || !article.summary.trim()) return;
    setSaving(true); setStatus(''); setError('');
    try {
      const updated = {
        ...data,
        lastUpdated: new Date().toISOString(),
        articles: [{ ...article, id: `news-${Date.now()}` }, ...data.articles],
      };
      await saveFile(token, 'src/data/news.json', updated, sha,
        `data: add news — ${article.headline.slice(0, 60)}`);
      setStatus('✓ Article published and deploying…');
      setArticle(BLANK());
      const fresh = await fetchFile(token, 'src/data/news.json');
      setData(fresh.content); setSha(fresh.sha);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const deleteArticle = async (id) => {
    if (!window.confirm('Delete this article?')) return;
    setSaving(true); setStatus(''); setError('');
    try {
      const updated = {
        ...data,
        lastUpdated: new Date().toISOString(),
        articles: data.articles.filter(a => a.id !== id),
      };
      await saveFile(token, 'src/data/news.json', updated, sha, 'data: delete news article');
      setStatus('✓ Article deleted.');
      const fresh = await fetchFile(token, 'src/data/news.json');
      setData(fresh.content); setSha(fresh.sha);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (error && !data) return <div className="admin-load-error">Failed to load: {error}</div>;
  if (!data) return <div className="admin-loading">Loading news.json…</div>;

  return (
    <div className="admin-editor">
      <div className="admin-editor__header">
        <h2 className="admin-editor__title">📰 News</h2>
        <p className="admin-editor__sub">Add articles to the top of the Newsroom. Newest first.</p>
      </div>

      {/* Add article form */}
      <div className="admin-card">
        <div className="admin-card__label">New article</div>

        <div className="admin-field">
          <label className="admin-label">Headline</label>
          <input className="admin-input" placeholder="Headline…"
            value={article.headline} onChange={e => set('headline', e.target.value)} />
        </div>

        <div className="admin-field">
          <label className="admin-label">Summary</label>
          <textarea className="admin-textarea" rows={3} placeholder="1–2 sentence summary…"
            value={article.summary} onChange={e => set('summary', e.target.value)} />
        </div>

        <div className="admin-row">
          <div className="admin-field">
            <label className="admin-label">Category</label>
            <select className="admin-select" value={article.category}
              onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label className="admin-label">Source</label>
            <input className="admin-input" value={article.source}
              onChange={e => set('source', e.target.value)} />
          </div>
          <div className="admin-field">
            <label className="admin-label">Date</label>
            <input className="admin-input" type="date" value={article.date}
              onChange={e => set('date', e.target.value)} />
          </div>
        </div>

        <div className="admin-row">
          <div className="admin-field">
            <label className="admin-label">Link (optional)</label>
            <input className="admin-input" placeholder="https://…"
              value={article.link || ''}
              onChange={e => set('link', e.target.value || null)} />
          </div>
          <div className="admin-field admin-field--checkbox">
            <label className="admin-label admin-checkbox-label">
              <input type="checkbox" checked={article.featured}
                onChange={e => set('featured', e.target.checked)} />
              Featured (pinned at top)
            </label>
          </div>
        </div>

        <div className="admin-save-bar">
          {error  && <span className="admin-status error">{error}</span>}
          {status && <span className="admin-status ok">{status}</span>}
          <button className="btn btn-primary" onClick={saveNew}
            disabled={saving || !article.headline.trim() || !article.summary.trim()}>
            {saving ? 'Publishing…' : 'Publish Article'}
          </button>
        </div>
      </div>

      {/* Existing articles */}
      <div className="admin-field" style={{ marginTop: 24 }}>
        <div className="admin-card__label">Existing articles ({data.articles.length})</div>
        <div className="admin-news-list">
          {data.articles.slice(0, 15).map(a => (
            <div key={a.id} className="admin-news-item">
              <div className="admin-news-item__cat">{a.category}</div>
              <div className="admin-news-item__headline">{a.headline}</div>
              <div className="admin-news-item__meta">{a.source} · {a.date}</div>
              <button className="admin-delete-btn" onClick={() => deleteArticle(a.id)}
                disabled={saving}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
