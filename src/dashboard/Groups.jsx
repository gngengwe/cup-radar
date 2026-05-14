import { useState } from 'react';
import { useStandings } from '../hooks/useStandings';

const STATUS_CONFIG = {
  advance:    { label: 'Advancing', color: 'var(--accent)',   bg: 'var(--accent-soft)' },
  playoff:    { label: 'Playoff',   color: '#4d8eff',         bg: 'var(--blue-soft)' },
  eliminated: { label: 'Out',       color: 'var(--text-dim)', bg: 'rgba(255,255,255,0.04)' },
  none:       { label: '',          color: 'transparent',     bg: 'transparent' },
};

function GroupTable({ group }) {
  const sorted = [...group.teams].sort((a, b) =>
    b.points - a.points || b.gd - a.gd || b.gf - a.gf
  );

  return (
    <div className="group-table-card">
      <div className="group-table-card__header">
        <span className="group-table-card__name">{group.name}</span>
      </div>
      <table className="group-table">
        <thead>
          <tr>
            <th className="gt-team">Team</th>
            <th>P</th><th>W</th><th>D</th><th>L</th>
            <th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((team, idx) => {
            const cfg = STATUS_CONFIG[team.status] || STATUS_CONFIG.none;
            return (
              <tr key={team.code} className={`gt-row${team.status === 'advance' ? ' advancing' : ''}`}>
                <td className="gt-team">
                  <span className="gt-pos">{idx + 1}</span>
                  <span className="gt-flag">{team.flag}</span>
                  <span className="gt-name">{team.name}</span>
                  {team.status !== 'none' && (
                    <span className="gt-status" style={{ color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>
                  )}
                </td>
                <td>{team.played}</td>
                <td>{team.won}</td>
                <td>{team.drawn}</td>
                <td>{team.lost}</td>
                <td>{team.gf}</td>
                <td>{team.ga}</td>
                <td>{team.gd > 0 ? '+' : ''}{team.gd}</td>
                <td className="gt-pts">{team.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Groups() {
  const { standings, loading, error, source } = useStandings();
  const [activeGroup, setActiveGroup] = useState(null);

  const displayed = activeGroup
    ? standings.filter(g => g.id === activeGroup)
    : standings;

  return (
    <div>
      <div className="dash-section-header">
        <h1 className="dash-section-title">Group Tracker</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {source === 'live' && <span className="data-source-badge live">● Live data</span>}
          {loading && <span className="loading-dot" />}
          <span className="dash-last-updated">{standings.length} groups · 48 teams</span>
        </div>
      </div>

      {error && (
        <div className="api-error-bar">Live standings unavailable — showing local data.</div>
      )}

      {/* ── Group pills ── */}
      <div className="group-pills">
        <button
          className={`group-pill${activeGroup === null ? ' active' : ''}`}
          onClick={() => setActiveGroup(null)}
        >All</button>
        {standings.map(g => (
          <button
            key={g.id}
            className={`group-pill${activeGroup === g.id ? ' active' : ''}`}
            onClick={() => setActiveGroup(g.id)}
          >{g.id}</button>
        ))}
      </div>

      <div className="groups-grid">
        {displayed.map(g => <GroupTable key={g.id} group={g} />)}
      </div>

      <div className="groups-legend">
        <span className="legend-item advance">⬆ Top 2 advance to Round of 32</span>
        <span className="legend-item playoff">~ 8 best 3rd-place teams also advance</span>
      </div>

      <p className="dash-disclaimer" style={{ marginTop: 24 }}>
        Group assignments are illustrative — verify with official FIFA sources.
        {source === 'live' ? ' Live standings via football-data.org.' : ' Standings update as matches are played.'}
        {' '}Cup Radar is not affiliated with FIFA.
      </p>
    </div>
  );
}
