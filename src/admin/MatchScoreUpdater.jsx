import { useState, useEffect } from 'react';
import { fetchFile, saveFile } from '../utils/github';
import FlagImg from '../components/FlagImg';

const STATUS_ORDER = { live: 0, scheduled: 1, finished: 2, postponed: 3 };

export default function MatchScoreUpdater({ token }) {
  const [data,    setData]    = useState(null);
  const [sha,     setSha]     = useState('');
  const [filter,  setFilter]  = useState('upcoming');
  const [saving,  setSaving]  = useState({});
  const [status,  setStatus]  = useState({});
  const [error,   setError]   = useState('');
  const [scores,  setScores]  = useState({});

  useEffect(() => {
    fetchFile(token, 'src/data/matches.json')
      .then(({ content, sha }) => { setData(content); setSha(sha); })
      .catch(e => setError(e.message));
  }, [token]);

  const setScore = (id, side, val) =>
    setScores(s => ({ ...s, [id]: { ...s[id], [side]: val === '' ? '' : parseInt(val, 10) } }));

  const saveMatch = async (matchId) => {
    const match   = data.matches.find(m => m.id === matchId);
    const sc      = scores[matchId] || {};
    const homeScore = sc.home ?? match.homeScore;
    const awayScore = sc.away ?? match.awayScore;

    setSaving(s => ({ ...s, [matchId]: true }));
    setStatus(s => ({ ...s, [matchId]: '' }));

    try {
      const updated = {
        ...data,
        matches: data.matches.map(m =>
          m.id === matchId
            ? { ...m, status: 'finished', homeScore, awayScore }
            : m
        ),
      };
      const sha2 = sha;
      await saveFile(token, 'src/data/matches.json', updated, sha2,
        `data: result — ${match.homeTeam} ${homeScore}–${awayScore} ${match.awayTeam}`);
      setStatus(s => ({ ...s, [matchId]: '✓ Saved' }));
      const fresh = await fetchFile(token, 'src/data/matches.json');
      setData(fresh.content); setSha(fresh.sha);
    } catch (e) {
      setStatus(s => ({ ...s, [matchId]: `✗ ${e.message}` }));
    }
    setSaving(s => ({ ...s, [matchId]: false }));
  };

  const markLive = async (matchId) => {
    setSaving(s => ({ ...s, [matchId]: true }));
    try {
      const updated = { ...data,
        matches: data.matches.map(m => m.id === matchId ? { ...m, status: 'live' } : m) };
      await saveFile(token, 'src/data/matches.json', updated, sha, `data: ${matchId} now live`);
      setStatus(s => ({ ...s, [matchId]: '✓ Marked live' }));
      const fresh = await fetchFile(token, 'src/data/matches.json');
      setData(fresh.content); setSha(fresh.sha);
    } catch (e) { setStatus(s => ({ ...s, [matchId]: `✗ ${e.message}` })); }
    setSaving(s => ({ ...s, [matchId]: false }));
  };

  if (error && !data) return <div className="admin-load-error">Failed to load: {error}</div>;
  if (!data) return <div className="admin-loading">Loading matches.json…</div>;

  const today = new Date().toISOString().split('T')[0];
  const matches = [...data.matches]
    .sort((a, b) => {
      const dateComp = a.date.localeCompare(b.date);
      if (dateComp !== 0) return dateComp;
      return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    })
    .filter(m => {
      if (filter === 'upcoming') return m.status === 'scheduled' || m.status === 'live';
      if (filter === 'today')    return m.date === today;
      if (filter === 'seattle')  return m.seattleMatch;
      if (filter === 'kc')       return m.kcMatch;
      if (filter === 'finished') return m.status === 'finished';
      return true;
    });

  return (
    <div className="admin-editor">
      <div className="admin-editor__header">
        <h2 className="admin-editor__title">⚽ Match Scores</h2>
        <p className="admin-editor__sub">Mark matches live, then save the final score when they end.</p>
      </div>

      <div className="filter-bar" style={{ marginBottom: 20 }}>
        {[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'today',    label: 'Today' },
          { id: 'seattle',  label: '🏟️ Seattle' },
          { id: 'kc',       label: '🏈 KC' },
          { id: 'finished', label: 'Finished' },
          { id: 'all',      label: 'All' },
        ].map(f => (
          <button key={f.id}
            className={`filter-chip${filter === f.id ? ' active' : ''}`}
            onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {matches.length === 0 && <div className="empty-state">No matches in this filter.</div>}

      <div className="admin-match-list">
        {matches.map(m => {
          const sc = scores[m.id] || {};
          const isLive     = m.status === 'live';
          const isFinished = m.status === 'finished';

          return (
            <div key={m.id} className={`admin-match-card${isLive ? ' live' : ''}${isFinished ? ' finished' : ''}`}>
              <div className="admin-match-card__info">
                <div className="admin-match-card__date">{m.date} · {m.time} {m.timezone}</div>
                <div className="admin-match-card__teams">
                  <FlagImg emoji={m.homeFlag} size={16} /> {m.homeTeam}
                  <span className="admin-match-card__vs">vs</span>
                  {m.awayTeam} <FlagImg emoji={m.awayFlag} size={16} />
                </div>
                <div className="admin-match-card__meta">
                  {m.stage} · {m.city}
                  {m.seattleMatch && <span className="match-row__seattle-tag" style={{marginLeft:6}}>SEA</span>}
                  {m.kcMatch      && <span className="match-row__kc-tag"      style={{marginLeft:6}}>KC</span>}
                </div>
              </div>

              <div className="admin-match-card__controls">
                {/* Score inputs */}
                <div className="admin-score-row">
                  <input type="number" min="0" max="20"
                    className="admin-score-input"
                    placeholder={isFinished ? String(m.homeScore ?? '–') : '0'}
                    value={sc.home ?? (isFinished ? (m.homeScore ?? '') : '')}
                    onChange={e => setScore(m.id, 'home', e.target.value)} />
                  <span className="admin-score-sep">–</span>
                  <input type="number" min="0" max="20"
                    className="admin-score-input"
                    placeholder={isFinished ? String(m.awayScore ?? '–') : '0'}
                    value={sc.away ?? (isFinished ? (m.awayScore ?? '') : '')}
                    onChange={e => setScore(m.id, 'away', e.target.value)} />
                </div>

                <div className="admin-match-actions">
                  {!isFinished && !isLive && (
                    <button className="admin-btn-sm live"
                      onClick={() => markLive(m.id)} disabled={saving[m.id]}>
                      ● Go Live
                    </button>
                  )}
                  <button
                    className={`admin-btn-sm${isFinished ? ' finished' : ' primary'}`}
                    onClick={() => saveMatch(m.id)}
                    disabled={saving[m.id]}
                  >
                    {saving[m.id] ? '…' : isFinished ? '↺ Update' : '✓ Full Time'}
                  </button>
                </div>

                {status[m.id] && (
                  <div className={`admin-match-status${status[m.id].startsWith('✓') ? ' ok' : ' error'}`}>
                    {status[m.id]}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
