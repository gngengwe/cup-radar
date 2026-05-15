import { useState, useEffect } from 'react';
import { fetchFile, saveFile } from '../utils/github';

const PHASES = ['pre-tournament', 'live', 'post-tournament'];
const ACTIONS = ['monitor', 'move', 'wait', null];
const URGENCY = ['low', 'medium', 'high', null];
const CATEGORIES = ['tournament', 'seattle', 'kansascity', 'tickets', 'teams', 'travel', 'culture'];

export default function AlertsEditor({ token }) {
  const [data,    setData]    = useState(null);
  const [sha,     setSha]     = useState('');
  const [saving,  setSaving]  = useState(false);
  const [status,  setStatus]  = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetchFile(token, 'src/data/alerts.json')
      .then(({ content, sha }) => { setData(content); setSha(sha); })
      .catch(e => setError(e.message));
  }, [token]);

  const save = async () => {
    setSaving(true); setStatus(''); setError('');
    try {
      const updated = { ...data, lastUpdated: new Date().toISOString() };
      await saveFile(token, 'src/data/alerts.json', updated, sha, 'data: update alerts');
      setStatus('✓ Saved and deploying…');
      // re-fetch to get new SHA
      const fresh = await fetchFile(token, 'src/data/alerts.json');
      setData(fresh.content); setSha(fresh.sha);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const setStory = (i, field, val) =>
    setData(d => ({ ...d, topStories: d.topStories.map((s, j) => j === i ? { ...s, [field]: val } : s) }));

  if (error && !data) return <div className="admin-load-error">Failed to load: {error}</div>;
  if (!data) return <div className="admin-loading">Loading alerts.json…</div>;

  return (
    <div className="admin-editor">
      <div className="admin-editor__header">
        <h2 className="admin-editor__title">⚡ Alerts</h2>
        <p className="admin-editor__sub">Updates every section's "last updated" and the Today Mode daily brief.</p>
      </div>

      {/* Phase + City Energy */}
      <div className="admin-row">
        <div className="admin-field">
          <label className="admin-label">Tournament phase</label>
          <select className="admin-select" value={data.phase} onChange={e => setData(d => ({ ...d, phase: e.target.value }))}>
            {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="admin-field">
          <label className="admin-label">Seattle city energy (1–5)</label>
          <div className="admin-energy-row">
            {[1,2,3,4,5].map(n => (
              <button key={n}
                className={`admin-energy-btn${n <= data.cityEnergy ? ' active' : ''}`}
                onClick={() => setData(d => ({ ...d, cityEnergy: n }))}
              >{n}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Seattle alert */}
      <div className="admin-field">
        <label className="admin-label">Seattle alert message</label>
        <textarea className="admin-textarea" rows={2}
          value={data.seattleAlert?.message || ''}
          onChange={e => setData(d => ({ ...d, seattleAlert: { ...d.seattleAlert, message: e.target.value } }))}
        />
        <div className="admin-row" style={{ marginTop: 6 }}>
          <input className="admin-input" placeholder="Source" value={data.seattleAlert?.source || ''}
            onChange={e => setData(d => ({ ...d, seattleAlert: { ...d.seattleAlert, source: e.target.value } }))} />
          <input className="admin-input" type="date" value={data.seattleAlert?.date || ''}
            onChange={e => setData(d => ({ ...d, seattleAlert: { ...d.seattleAlert, date: e.target.value } }))} />
        </div>
      </div>

      {/* Ticket alert */}
      <div className="admin-field">
        <label className="admin-label">Ticket alert message</label>
        <input className="admin-input" value={data.ticketAlert?.message || ''}
          onChange={e => setData(d => ({ ...d, ticketAlert: { ...d.ticketAlert, message: e.target.value } }))} />
        <div className="admin-row" style={{ marginTop: 6 }}>
          <select className="admin-select" value={data.ticketAlert?.action || ''}
            onChange={e => setData(d => ({ ...d, ticketAlert: { ...d.ticketAlert, action: e.target.value } }))}>
            {ACTIONS.map(a => <option key={a} value={a ?? ''}>{a ?? '(none)'}</option>)}
          </select>
          <select className="admin-select" value={data.ticketAlert?.urgency || ''}
            onChange={e => setData(d => ({ ...d, ticketAlert: { ...d.ticketAlert, urgency: e.target.value } }))}>
            {URGENCY.map(u => <option key={u} value={u ?? ''}>{u ?? '(none)'}</option>)}
          </select>
        </div>
      </div>

      {/* Top 3 stories */}
      <div className="admin-field">
        <label className="admin-label">Top stories (shown in Today Mode)</label>
        {(data.topStories || []).map((s, i) => (
          <div key={i} className="admin-story-row">
            <span className="admin-story-num">{i + 1}</span>
            <input className="admin-input" placeholder="Headline" value={s.headline}
              onChange={e => setStory(i, 'headline', e.target.value)} />
            <select className="admin-select admin-select--sm" value={s.category}
              onChange={e => setStory(i, 'category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="admin-input admin-input--sm" type="date" value={s.date}
              onChange={e => setStory(i, 'date', e.target.value)} />
          </div>
        ))}
      </div>

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
