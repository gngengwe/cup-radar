import { useState, useEffect } from 'react';
import { fetchFile, saveFile } from '../utils/github';

export default function BracketEditor({ token }) {
  const [data,    setData]    = useState(null);
  const [sha,     setSha]     = useState('');
  const [saving,  setSaving]  = useState(false);
  const [status,  setStatus]  = useState('');
  const [error,   setError]   = useState('');
  const [activeRound, setActiveRound] = useState('r32');
  const [scores,  setScores]  = useState({});  // { matchId: { home, away } }

  useEffect(() => {
    fetchFile(token, 'src/data/bracket.json')
      .then(({ content, sha }) => { setData(content); setSha(sha); })
      .catch(e => setError(e.message));
  }, [token]);

  const updateMatch = (roundId, matchId, field, value) =>
    setData(d => ({
      ...d,
      rounds: d.rounds.map(r =>
        r.id === roundId
          ? { ...r, matches: r.matches.map(m => m.id === matchId ? { ...m, [field]: value } : m) }
          : r
      ),
    }));

  const saveScore = (roundId, match) => {
    const sc = scores[match.id] || {};
    const homeScore = sc.home !== undefined ? Number(sc.home) : match.homeScore;
    const awayScore = sc.away !== undefined ? Number(sc.away) : match.awayScore;
    updateMatch(roundId, match.id, 'homeScore', homeScore);
    updateMatch(roundId, match.id, 'awayScore', awayScore);
    updateMatch(roundId, match.id, 'status', 'finished');
  };

  const save = async () => {
    setSaving(true); setStatus(''); setError('');
    try {
      const updated = { ...data, lastUpdated: new Date().toISOString() };
      await saveFile(token, 'src/data/bracket.json', updated, sha, 'data: update bracket');
      setStatus('✓ Saved and deploying…'); setTimeout(() => setStatus(''), 5000);
      const fresh = await fetchFile(token, 'src/data/bracket.json');
      setData(fresh.content); setSha(fresh.sha);
      setScores({});
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (error && !data) return <div className="admin-load-error">Failed to load: {error}</div>;
  if (!data) return <div className="admin-loading">Loading bracket.json…</div>;

  const currentRound = data.rounds.find(r => r.id === activeRound) || data.rounds[0];

  return (
    <div className="admin-editor">
      <div className="admin-editor__header">
        <h2 className="admin-editor__title">🏆 Bracket</h2>
        <p className="admin-editor__sub">Fill in team names as teams advance. Record knockout results.</p>
      </div>

      {/* Round tabs */}
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        {data.rounds.map(r => (
          <button key={r.id}
            className={`filter-chip${activeRound === r.id ? ' active' : ''}`}
            onClick={() => setActiveRound(r.id)}>
            {r.shortName}
          </button>
        ))}
      </div>

      <div className="admin-card__label">{currentRound.name} · {currentRound.dates}</div>

      {currentRound.matches.map(m => (
        <div key={m.id} className="admin-card" style={{ marginBottom: 8 }}>
          {m.label && <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', marginBottom: 6 }}>{m.label}</div>}
          <div className="admin-row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Home team */}
            <input className="admin-input" style={{ maxWidth: 160 }}
              placeholder={m.home || 'Home team'}
              value={m.home ?? ''}
              onChange={e => updateMatch(currentRound.id, m.id, 'home', e.target.value)} />
            {/* Score */}
            <div className="admin-score-row">
              <input type="number" min="0" max="20" className="admin-score-input"
                placeholder={m.homeScore ?? '–'}
                value={scores[m.id]?.home ?? (m.homeScore ?? '')}
                onChange={e => setScores(s => ({ ...s, [m.id]: { ...s[m.id], home: e.target.value } }))} />
              <span className="admin-score-sep">–</span>
              <input type="number" min="0" max="20" className="admin-score-input"
                placeholder={m.awayScore ?? '–'}
                value={scores[m.id]?.away ?? (m.awayScore ?? '')}
                onChange={e => setScores(s => ({ ...s, [m.id]: { ...s[m.id], away: e.target.value } }))} />
            </div>
            {/* Away team */}
            <input className="admin-input" style={{ maxWidth: 160 }}
              placeholder={m.away || 'Away team'}
              value={m.away ?? ''}
              onChange={e => updateMatch(currentRound.id, m.id, 'away', e.target.value)} />
            {/* Status */}
            <select className="admin-select" style={{ maxWidth: 120 }} value={m.status}
              onChange={e => updateMatch(currentRound.id, m.id, 'status', e.target.value)}>
              <option value="upcoming">Upcoming</option>
              <option value="live">● Live</option>
              <option value="finished">Finished</option>
            </select>
            {/* Quick save score */}
            {scores[m.id] && (
              <button className="admin-btn-sm primary" onClick={() => saveScore(currentRound.id, m)}>
                ✓ Set score
              </button>
            )}
          </div>
          {m.city && m.city !== 'TBD' && (
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>{m.city}</div>
          )}
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
