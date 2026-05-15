import { useState, useEffect } from 'react';
import { fetchFile, saveFile } from '../utils/github';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',         color: 'var(--text-dim)' },
  happened: { label: '✓ Happened',      color: 'var(--accent)' },
  didnt:    { label: '✗ Didn\'t happen', color: '#f87171' },
};

const IMPORTANCE_COLOR = { critical: '#f87171', high: '#ffb84d', medium: 'var(--text-dim)' };

export default function ScenarioUpdater({ token }) {
  const [data,   setData]   = useState(null);
  const [sha,    setSha]    = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error,  setError]  = useState('');
  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => {
    fetchFile(token, 'src/data/scenarios.json')
      .then(({ content, sha }) => { setData(content); setSha(sha); })
      .catch(e => setError(e.message));
  }, [token]);

  const setScenarioStatus = (groupId, scenarioId, newStatus) => {
    setData(d => ({
      ...d,
      groups: {
        ...d.groups,
        [groupId]: {
          ...d.groups[groupId],
          scenarios: d.groups[groupId].scenarios.map(s =>
            s.id === scenarioId ? { ...s, status: newStatus } : s
          ),
        },
      },
    }));
  };

  const save = async () => {
    setSaving(true); setStatus(''); setError('');
    try {
      const updated = { ...data, lastUpdated: new Date().toISOString() };
      await saveFile(token, 'src/data/scenarios.json', updated, sha, 'data: update scenarios');
      setStatus('✓ Saved and deploying…');
      const fresh = await fetchFile(token, 'src/data/scenarios.json');
      setData(fresh.content); setSha(fresh.sha);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (error && !data) return <div className="admin-load-error">Failed to load: {error}</div>;
  if (!data) return <div className="admin-loading">Loading scenarios.json…</div>;

  const groups  = Object.keys(data.groups);
  const display = activeGroup ? [activeGroup] : groups;

  // Count pending scenarios
  const pendingCount = groups.reduce((acc, gId) =>
    acc + data.groups[gId].scenarios.filter(s => s.status === 'pending').length, 0);

  return (
    <div className="admin-editor">
      <div className="admin-editor__header">
        <h2 className="admin-editor__title">🎯 Scenarios</h2>
        <p className="admin-editor__sub">
          Mark group stage scenarios as they resolve.
          {pendingCount > 0 && <span className="admin-badge">{pendingCount} pending</span>}
        </p>
      </div>

      {/* Group filter */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <button className={`group-pill${activeGroup === null ? ' active' : ''}`}
          onClick={() => setActiveGroup(null)}>All</button>
        {groups.map(g => {
          const hasResolved = data.groups[g].scenarios.some(s => s.status !== 'pending');
          return (
            <button key={g}
              className={`group-pill${activeGroup === g ? ' active' : ''}${hasResolved ? ' has-city-match' : ''}`}
              onClick={() => setActiveGroup(activeGroup === g ? null : g)}>
              {g}
            </button>
          );
        })}
      </div>

      {display.map(gId => {
        const group = data.groups[gId];
        return (
          <div key={gId} className="admin-scenario-group">
            <div className="admin-scenario-group__header">
              Group {gId} — <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{group.summary}</span>
            </div>
            {group.scenarios.map(s => {
              const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
              return (
                <div key={s.id} className="admin-scenario-card">
                  <div className="admin-scenario-card__top">
                    <span style={{ color: IMPORTANCE_COLOR[s.importance] || 'var(--text-dim)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      {s.importance}
                    </span>
                    <span className="admin-scenario-status" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <div className="admin-scenario-condition">If: {s.condition}</div>
                  <div className="admin-scenario-outcome">Then: {s.outcome}</div>
                  <div className="admin-scenario-actions">
                    {['pending', 'happened', 'didnt'].map(st => (
                      <button key={st}
                        className={`admin-scenario-btn${s.status === st ? ' active-' + st : ''}`}
                        onClick={() => setScenarioStatus(gId, s.id, st)}>
                        {STATUS_CONFIG[st].label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      <div className="admin-save-bar" style={{ marginTop: 24 }}>
        {error  && <span className="admin-status error">{error}</span>}
        {status && <span className="admin-status ok">{status}</span>}
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save All Scenarios'}
        </button>
      </div>
    </div>
  );
}
