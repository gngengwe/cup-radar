import { useState, useEffect } from 'react';
import { fetchFile, saveFile } from '../utils/github';

const CATEGORIES = ['tournament', 'general', 'seattle', 'kansascity', 'tickets', 'teams', 'travel', 'culture'];

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

function statusInfo(a) {
  if (a.archived) return { label: 'Archived', cls: 'archived' };
  if (a.draft)    return { label: 'Held',     cls: 'held'     };
  return               { label: 'Published', cls: 'published' };
}

const FILTERS = ['all', 'published', 'held', 'archived'];

export default function NewsEditor({ token }) {
  const [data,    setData]    = useState(null);
  const [sha,     setSha]     = useState('');
  const [article, setArticle] = useState(BLANK);
  const [saving,  setSaving]  = useState(false);
  const [status,  setStatus]  = useState('');
  const [error,   setError]   = useState('');
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    fetchFile(token, 'src/data/news.json')
      .then(({ content, sha }) => { setData(content); setSha(sha); })
      .catch(e => setError(e.message));
  }, [token]);

  const set = (field, val) => setArticle(a => ({ ...a, [field]: val }));

  const persist = async (articles, message) => {
    const updated = { ...data, lastUpdated: new Date().toISOString(), articles };
    await saveFile(token, 'src/data/news.json', updated, sha, message);
    const fresh = await fetchFile(token, 'src/data/news.json');
    setData(fresh.content); setSha(fresh.sha);
  };

  const saveNew = async () => {
    if (!article.headline.trim() || !article.summary.trim()) return;
    setSaving(true); setStatus(''); setError('');
    try {
      const a = { ...article, id: `news-${Date.now()}`, publishedAt: new Date().toISOString() };
      await persist([a, ...data.articles], `data: add news — ${article.headline.slice(0, 60)}`);
      setStatus('✓ Published.'); setTimeout(() => setStatus(''), 4000);
      setArticle(BLANK());
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const publishArticle = async (id) => {
    setSaving(true); setStatus(''); setError('');
    try {
      const articles = data.articles.map(a =>
        a.id === id ? { ...a, draft: false, publishedAt: new Date().toISOString() } : a
      );
      await persist(articles, 'data: publish news article');
      setStatus('✓ Published.'); setTimeout(() => setStatus(''), 4000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const archiveArticle = async (id) => {
    setSaving(true); setStatus(''); setError('');
    try {
      const articles = data.articles.map(a => a.id === id ? { ...a, archived: true } : a);
      await persist(articles, 'data: archive news article');
      setStatus('✓ Archived.'); setTimeout(() => setStatus(''), 4000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const deleteArticle = async (id) => {
    if (!window.confirm('Permanently delete this article?')) return;
    setSaving(true); setStatus(''); setError('');
    try {
      await persist(data.articles.filter(a => a.id !== id), 'data: delete news article');
      setStatus('✓ Deleted.'); setTimeout(() => setStatus(''), 4000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (error && !data) return <div className="admin-load-error">Failed to load: {error}</div>;
  if (!data) return <div className="admin-loading">Loading news.json…</div>;

  const counts = {
    all:       data.articles.length,
    published: data.articles.filter(a => !a.draft && !a.archived).length,
    held:      data.articles.filter(a =>  a.draft && !a.archived).length,
    archived:  data.articles.filter(a =>  a.archived).length,
  };

  const visible = filter === 'all'       ? data.articles
    : filter === 'published' ? data.articles.filter(a => !a.draft && !a.archived)
    : filter === 'held'      ? data.articles.filter(a =>  a.draft && !a.archived)
    :                          data.articles.filter(a =>  a.archived);

  return (
    <div className="admin-editor">
      <div className="admin-editor__header">
        <h2 className="admin-editor__title">📰 News</h2>
        <p className="admin-editor__sub">Held items are hidden from the site until published.</p>
      </div>

      {/* ── New article form ── */}
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

      {/* ── Article list ── */}
      <div style={{ marginTop: 24 }}>
        {(error || status) && (
          <div className="admin-save-bar" style={{ marginBottom: 12 }}>
            {error  && <span className="admin-status error">{error}</span>}
            {status && <span className="admin-status ok">{status}</span>}
          </div>
        )}
        <div className="news-filter-bar">
          {FILTERS.map(f => (
            <button key={f}
              className={`news-filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}&nbsp;
              <span className="news-filter-count">{counts[f]}</span>
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="news-empty">No {filter === 'all' ? '' : filter} articles.</p>
        ) : (
          <div className="news-table">
            <div className="news-table__head">
              <span>Headline</span>
              <span>Article date</span>
              <span>Published on site</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {visible.map(a => {
              const st = statusInfo(a);
              return (
                <div key={a.id} className={`news-table__row news-table__row--${st.cls}`}>
                  <div className="news-table__headline">
                    <span className="news-cat">{a.category}</span>
                    <span className="news-headline-text">{a.headline}</span>
                    {a.source && a.source !== 'Cup Radar' && (
                      <span className="news-source">via {a.source}</span>
                    )}
                  </div>
                  <div className="news-table__date">{a.date || '—'}</div>
                  <div className="news-table__pubdate">
                    {a.publishedAt ? a.publishedAt.split('T')[0] : '—'}
                  </div>
                  <div className="news-table__status">
                    <span className={`news-status news-status--${st.cls}`}>{st.label}</span>
                  </div>
                  <div className="news-table__actions">
                    {a.draft && !a.archived && (
                      <button className="btn news-action-btn news-action-btn--publish"
                        onClick={() => publishArticle(a.id)} disabled={saving}>
                        Publish
                      </button>
                    )}
                    {!a.archived && (
                      <button className="btn news-action-btn news-action-btn--archive"
                        onClick={() => archiveArticle(a.id)} disabled={saving}>
                        Archive
                      </button>
                    )}
                    <button className="btn news-action-btn news-action-btn--delete"
                      onClick={() => deleteArticle(a.id)} disabled={saving}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
