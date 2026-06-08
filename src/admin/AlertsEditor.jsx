import { useState, useEffect } from 'react';
import { fetchFile, saveFile } from '../utils/github';

const PHASES      = ['pre-tournament', 'live', 'post-tournament'];
const PULSE_ACTIONS = ['move', 'watch', 'wait'];
const CATEGORIES  = ['tournament', 'general', 'seattle', 'kansascity', 'miami', 'newyork', 'philly', 'tickets', 'teams', 'travel', 'culture'];
const CITIES      = [
  { id: 'seattle',    label: '🏟️ Seattle'       },
  { id: 'kansascity', label: '🏈 Kansas City'    },
  { id: 'miami',      label: '🌴 Miami'          },
  { id: 'newyork',    label: '🗽 New York'       },
  { id: 'philly',     label: '🦅 Philadelphia'   },
];

export default function AlertsEditor({ token }) {
  const [data,       setData]       = useState(null);
  const [sha,        setSha]        = useState('');
  const [saving,     setSaving]     = useState(false);
  const [status,     setStatus]     = useState('');
  const [error,      setError]      = useState('');
  const [alertCity,  setAlertCity]  = useState('seattle');

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
      setStatus('✓ Saved and deploying…'); setTimeout(() => setStatus(''), 5000);
      // re-fetch to get new SHA
      const fresh = await fetchFile(token, 'src/data/alerts.json');
      setData(fresh.content); setSha(fresh.sha);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const setStory = (i, field, val) =>
    setData(d => ({ ...d, topStories: d.topStories.map((s, j) => j === i ? { ...s, [field]: val } : s) }));

  const setCityAlert = (cityId, field, val) =>
    setData(d => ({
      ...d,
      cityAlerts: { ...d.cityAlerts, [cityId]: { ...d.cityAlerts?.[cityId], [field]: val } },
    }));

  const setCityEnergy = (cityId, val) =>
    setData(d => ({
      ...d,
      cityEnergy: { ...d.cityEnergy, [cityId]: val },
    }));

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
          <label className="admin-label">City energy (1–5 per city)</label>
          {CITIES.map(({ id, label }) => (
            <div key={id} className="admin-pulse-row">
              <span className="admin-pulse-city">{label}</span>
              <div className="admin-energy-row">
                {[1,2,3,4,5].map(n => (
                  <button key={n}
                    className={`admin-energy-btn${n <= (data.cityEnergy?.[id] ?? 3) ? ' active' : ''}`}
                    onClick={() => setCityEnergy(id, n)}
                  >{n}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* City alerts */}
      <div className="admin-field">
        <label className="admin-label">City alert</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {CITIES.map(({ id, label }) => (
            <button key={id}
              className={`filter-chip${alertCity === id ? ' active' : ''}`}
              onClick={() => setAlertCity(id)}
            >{label}</button>
          ))}
        </div>
        <textarea className="admin-textarea" rows={2}
          value={data.cityAlerts?.[alertCity]?.message || ''}
          onChange={e => setCityAlert(alertCity, 'message', e.target.value)}
        />
        <div className="admin-row" style={{ marginTop: 6 }}>
          <input className="admin-input" placeholder="Source"
            value={data.cityAlerts?.[alertCity]?.source || ''}
            onChange={e => setCityAlert(alertCity, 'source', e.target.value)} />
          <input className="admin-input" type="date"
            value={data.cityAlerts?.[alertCity]?.date || ''}
            onChange={e => setCityAlert(alertCity, 'date', e.target.value)} />
        </div>
      </div>

      {/* Ticket pulse — per city */}
      <div className="admin-field">
        <label className="admin-label">Ticket pulse (per city)</label>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px' }}>
          MOVE = act now · WATCH = monitor · WAIT = overpriced
        </p>
        {CITIES.map(({ id, label }) => {
          const pulse = data.ticketPulse?.[id] || {};
          const setField = (field, val) => setData(d => ({
            ...d,
            ticketPulse: {
              ...d.ticketPulse,
              [id]: { ...d.ticketPulse?.[id], [field]: val, updatedAt: new Date().toISOString().split('T')[0] },
            },
          }));
          return (
            <div key={id} className="admin-pulse-row">
              <span className="admin-pulse-city">{label}</span>
              <select className="admin-select admin-select--sm"
                value={pulse.action || 'watch'}
                onChange={e => setField('action', e.target.value)}
              >
                {PULSE_ACTIONS.map(a => <option key={a} value={a}>{a.toUpperCase()}</option>)}
              </select>
              <input className="admin-input" placeholder="One-line market note…"
                value={pulse.note || ''}
                onChange={e => setField('note', e.target.value)}
              />
            </div>
          );
        })}
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
