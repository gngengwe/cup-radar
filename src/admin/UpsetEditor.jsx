import { useState, useEffect } from 'react';
import { fetchFile, saveFile } from '../utils/github';
import FlagImg from '../components/FlagImg';

const RESULT_CONFIG = {
  null:      { label: 'Pending',          color: 'var(--text-dim)' },
  upset:     { label: '✓ Upset happened', color: '#f87171' },
  no_upset:  { label: '✗ Favorite won',   color: 'var(--text-muted)' },
  draw:      { label: '~ Draw',           color: '#ffb84d' },
};

export default function UpsetEditor({ token }) {
  const [data,    setData]    = useState(null);
  const [sha,     setSha]     = useState('');
  const [saving,  setSaving]  = useState(false);
  const [status,  setStatus]  = useState('');
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetchFile(token, 'src/data/upsets.json')
      .then(({ content, sha }) => { setData(content); setSha(sha); })
      .catch(e => setError(e.message));
  }, [token]);

  const setResult = (id, result) =>
    setData(d => ({
      ...d,
      upsets: d.upsets.map(u =>
        u.id === id ? { ...u, result, status: result ? 'resolved' : 'upcoming' } : u
      ),
    }));

  const setRisk = (id, score) =>
    setData(d => ({ ...d, upsets: d.upsets.map(u => u.id === id ? { ...u, riskScore: score } : u) }));

  const save = async () => {
    setSaving(true); setStatus(''); setError('');
    try {
      const updated = { ...data, lastUpdated: new Date().toISOString() };
      await saveFile(token, 'src/data/upsets.json', updated, sha, 'data: update upsets');
      setStatus('✓ Saved and deploying…'); setTimeout(() => setStatus(''), 5000);
      const fresh = await fetchFile(token, 'src/data/upsets.json');
      setData(fresh.content); setSha(fresh.sha);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (error && !data) return <div className="admin-load-error">Failed to load: {error}</div>;
  if (!data) return <div className="admin-loading">Loading upsets.json…</div>;

  return (
    <div className="admin-editor">
      <div className="admin-editor__header">
        <h2 className="admin-editor__title">🚨 Upsets</h2>
        <p className="admin-editor__sub">Mark upsets as they happen (or don't). Update risk scores post-match.</p>
      </div>

      {data.upsets.map(u => {
        const resultCfg = RESULT_CONFIG[u.result ?? 'null'] || RESULT_CONFIG.null;
        return (
          <div key={u.id} className="admin-card" style={{ marginBottom: 8 }}>
            <div className="admin-row" style={{ alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {u.teamFlags?.map((f, i) => <FlagImg key={i} emoji={f} size={20} />)}
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{u.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{u.stage}{u.date ? ` · ${u.date}` : ''}</div>
              </div>
              {/* Risk score */}
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--text-dim)', marginRight: 4 }}>Risk</span>
                {[1,2,3,4,5].map(n => (
                  <button key={n}
                    className={`admin-energy-btn${n <= u.riskScore ? ' active' : ''}`}
                    style={{ width: 26, height: 26, fontSize: 12 }}
                    onClick={() => setRisk(u.id, n)}>{n}</button>
                ))}
              </div>
            </div>

            {/* Result buttons */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', marginRight: 4, alignSelf: 'center' }}>Result:</span>
              {['upset', 'no_upset', 'draw', null].map(r => {
                const cfg = RESULT_CONFIG[r ?? 'null'];
                const isActive = (u.result ?? null) === r;
                return (
                  <button key={String(r)}
                    className="admin-scenario-btn"
                    style={isActive ? { background: cfg.color + '22', color: cfg.color, borderColor: cfg.color + '44' } : {}}
                    onClick={() => setResult(u.id, r)}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

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
