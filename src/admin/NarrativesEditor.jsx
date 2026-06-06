import { useState, useEffect } from 'react';
import { fetchFile, saveFile } from '../utils/github';

const STATUSES  = ['pre-tournament', 'building', 'climax', 'resolved'];
const STATUS_COLORS = { 'pre-tournament': '#4d8eff', building: '#ffb84d', climax: 'var(--accent)', resolved: 'var(--text-muted)' };

export default function NarrativesEditor({ token }) {
  const [data,    setData]    = useState(null);
  const [sha,     setSha]     = useState('');
  const [saving,  setSaving]  = useState(false);
  const [status,  setStatus]  = useState('');
  const [error,   setError]   = useState('');
  const [chapter, setChapter] = useState({});  // { [narrativeId]: string }

  useEffect(() => {
    fetchFile(token, 'src/data/narratives.json')
      .then(({ content, sha }) => { setData(content); setSha(sha); })
      .catch(e => setError(e.message));
  }, [token]);

  const updateStatus = (id, newStatus) =>
    setData(d => ({ ...d, narratives: d.narratives.map(n => n.id === id ? { ...n, status: newStatus } : n) }));

  const addChapter = (id) => {
    const text = chapter[id]?.trim();
    if (!text) return;
    setData(d => ({
      ...d,
      narratives: d.narratives.map(n =>
        n.id === id
          ? { ...n, chapters: [...(n.chapters || []), text], chapterCount: (n.chapterCount || 0) + 1 }
          : n
      ),
    }));
    setChapter(c => ({ ...c, [id]: '' }));
  };

  const removeChapter = (id, idx) =>
    setData(d => ({
      ...d,
      narratives: d.narratives.map(n =>
        n.id === id
          ? { ...n, chapters: n.chapters.filter((_, i) => i !== idx), chapterCount: Math.max(0, (n.chapterCount || 0) - 1) }
          : n
      ),
    }));

  const save = async () => {
    setSaving(true); setStatus(''); setError('');
    try {
      const updated = { ...data, lastUpdated: new Date().toISOString() };
      await saveFile(token, 'src/data/narratives.json', updated, sha, 'data: update narratives');
      setStatus('✓ Saved and deploying…'); setTimeout(() => setStatus(''), 5000);
      const fresh = await fetchFile(token, 'src/data/narratives.json');
      setData(fresh.content); setSha(fresh.sha);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (error && !data) return <div className="admin-load-error">Failed to load: {error}</div>;
  if (!data) return <div className="admin-loading">Loading narratives.json…</div>;

  return (
    <div className="admin-editor">
      <div className="admin-editor__header">
        <h2 className="admin-editor__title">📖 Narratives</h2>
        <p className="admin-editor__sub">Update storyline status and add chapters as the tournament progresses.</p>
      </div>

      {data.narratives.map(n => (
        <div key={n.id} className="admin-card" style={{ marginBottom: 10 }}>
          <div className="admin-row" style={{ alignItems: 'center', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{n.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                {n.teamFlags?.join(' ')} · {n.chapterCount || 0} chapters
              </div>
            </div>
            <div className="admin-row" style={{ gap: 6, flexWrap: 'wrap' }}>
              {STATUSES.map(s => (
                <button key={s}
                  className="admin-scenario-btn"
                  style={n.status === s ? { background: STATUS_COLORS[s] + '22', color: STATUS_COLORS[s], borderColor: STATUS_COLORS[s] + '44' } : {}}
                  onClick={() => updateStatus(n.id, s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Existing chapters */}
          {n.chapters?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {n.chapters.map((ch, i) => (
                <div key={i} className="narrative-chapter" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span className="narrative-chapter__num">Ch.{i + 1}</span>
                  <span className="narrative-chapter__text" style={{ flex: 1 }}>
                    {typeof ch === 'string' ? ch : (
                      <>
                        {ch.title}
                        {ch.sourceLink && (
                          <a href={ch.sourceLink} target="_blank" rel="noopener noreferrer"
                            style={{ marginLeft: 6, fontSize: 10, opacity: 0.5 }}>↗</a>
                        )}
                        {ch.draft && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-muted)' }}>draft</span>}
                      </>
                    )}
                  </span>
                  <button className="admin-delete-btn" onClick={() => removeChapter(n.id, i)} style={{ flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Add chapter */}
          <div className="admin-row">
            <input
              className="admin-input"
              placeholder="Add a chapter (one sentence — what just happened)…"
              value={chapter[n.id] || ''}
              onChange={e => setChapter(c => ({ ...c, [n.id]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addChapter(n.id)}
            />
            <button className="admin-btn-sm primary" onClick={() => addChapter(n.id)}
              disabled={!chapter[n.id]?.trim()}>+ Add</button>
          </div>
        </div>
      ))}

      <div className="admin-save-bar">
        {error  && <span className="admin-status error">{error}</span>}
        {status && <span className="admin-status ok">{status}</span>}
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save & Deploy'}
        </button>
      </div>
    </div>
  );
}
