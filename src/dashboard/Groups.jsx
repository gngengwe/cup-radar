import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useStandings } from '../hooks/useStandings';
import scenarioData from '../data/scenarios.json';
import matchData from '../data/matches.json';
import FlagImg from '../components/FlagImg';
import { getCityMeta, CITY_META } from '../utils/cityConfig';

// Pre-compute which groups have matches in each city
const CITY_GROUPS = Object.fromEntries(
  Object.entries(CITY_META).map(([id, meta]) => [
    id,
    [...new Set(matchData.matches.filter(m => m[meta.matchFlag] && m.group).map(m => m.group))],
  ])
);

const STATUS_CONFIG = {
  advance:    { label: 'Advancing', color: 'var(--accent)',   bg: 'var(--accent-soft)' },
  playoff:    { label: 'Playoff',   color: '#4d8eff',         bg: 'var(--blue-soft)' },
  eliminated: { label: 'Out',       color: 'var(--text-dim)', bg: 'rgba(255,255,255,0.04)' },
  none:       { label: '',          color: 'transparent',     bg: 'transparent' },
};

function GroupTable({ group, cityGroups }) {
  const sorted = useMemo(() =>
    [...group.teams].sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf),
    [group.teams]
  );
  const playsInCity = cityGroups?.includes(group.id);

  return (
    <div className={`group-table-card${playsInCity ? ' city-group' : ''}`}>
      <div className="group-table-card__header">
        <span className="group-table-card__name">{group.name}</span>
        {playsInCity && <span className="group-table-card__city-badge">🏟️ Hosts matches</span>}
      </div>
      <div style={{ overflowX: 'auto' }}>
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
                  <FlagImg emoji={team.flag} size={16} className="gt-flag" />
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
    </div>
  );
}

const IMPORTANCE_CONFIG = {
  critical: { color: '#f87171', label: 'Critical' },
  high:     { color: '#ffb84d', label: 'High'     },
  medium:   { color: 'var(--text-muted)', label: 'Medium' },
};

const SCENARIO_STATUS = {
  pending:  { label: 'Pending',  color: 'var(--text-dim)'    },
  happened: { label: '✓ Happened', color: 'var(--accent)'   },
  didnt:    { label: '✗ Didn\'t happen', color: 'var(--text-muted)' },
};

function ScenarioGroup({ groupId, data }) {
  const scenarios = data.groups[groupId];
  if (!scenarios) return null;
  return (
    <div className="scenario-group">
      <div className="scenario-group__header">Group {groupId} — {scenarios.summary}</div>
      <div className="scenario-list">
        {scenarios.scenarios.map(s => {
          const imp = IMPORTANCE_CONFIG[s.importance] || IMPORTANCE_CONFIG.medium;
          const st  = SCENARIO_STATUS[s.status] || SCENARIO_STATUS.pending;
          return (
            <div key={s.id} className={`scenario-card scenario-card--${s.importance}`}>
              <div className="scenario-card__top">
                <span className="scenario-card__importance" style={{ color: imp.color }}>
                  {imp.label}
                </span>
                <span className="scenario-card__status" style={{ color: st.color }}>
                  {st.label}
                </span>
              </div>
              <div className="scenario-card__condition">If: {s.condition}</div>
              <div className="scenario-card__outcome">Then: {s.outcome}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Groups() {
  const { city = 'seattle' }                    = useParams();
  const { standings, loading, error, source }   = useStandings();
  const [activeGroup,  setActiveGroup]  = useState(null);
  const [tab,          setTab]          = useState('standings');
  const [cityOnly,     setCityOnly]     = useState(false);

  const cityGroups = CITY_GROUPS[city] || [];

  const displayed = useMemo(() => {
    let list = activeGroup ? standings.filter(g => g.id === activeGroup) : standings;
    if (cityOnly) list = list.filter(g => cityGroups.includes(g.id));
    return list;
  }, [standings, activeGroup, cityOnly, cityGroups]);

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">Group Tracker</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {source === 'live' && <span className="data-source-badge live">● Live data</span>}
          {loading && <span className="loading-dot" />}
          <span className="dash-last-updated">{standings.length} groups · 48 teams</span>
        </div>
      </div>

      {error && (
        <div className="api-error-bar">Live standings unavailable — showing local data.</div>
      )}

      {/* ── View tabs ── */}
      <div className="group-view-tabs">
        <button
          className={`group-view-tab${tab === 'standings' ? ' active' : ''}`}
          onClick={() => setTab('standings')}
        >📊 Standings</button>
        <button
          className={`group-view-tab${tab === 'scenarios' ? ' active' : ''}`}
          onClick={() => setTab('scenarios')}
        >🎯 Scenarios</button>
      </div>

      {/* ── Group pills + city filter ── */}
      {(tab === 'standings' || tab === 'scenarios') && (
        <div className="group-pills">
          <button
            className={`group-pill${activeGroup === null ? ' active' : ''}`}
            onClick={() => { setActiveGroup(null); setCityOnly(false); }}
          >All</button>
          {cityGroups.length > 0 && tab === 'standings' && (
            <button
              className={`group-pill city-pill${cityOnly ? ' active' : ''}`}
              onClick={() => { setCityOnly(v => !v); setActiveGroup(null); }}
              title={`Groups playing in ${getCityMeta(city).label}`}
            >🏟️ My city</button>
          )}
          {standings.map(g => (
            <button
              key={g.id}
              className={`group-pill${activeGroup === g.id ? ' active' : ''}${cityGroups.includes(g.id) ? ' has-city-match' : ''}`}
              onClick={() => { setActiveGroup(g.id); setCityOnly(false); }}
            >{g.id}</button>
          ))}
        </div>
      )}

      {tab === 'standings' && (
      <>
      <div className="groups-grid">
        {displayed.map(g => <GroupTable key={g.id} group={g} cityGroups={cityGroups} />)}
      </div>

      <div className="groups-legend">
        <span className="legend-item advance">⬆ Top 2 advance to Round of 32</span>
        <span className="legend-item playoff">~ 8 best 3rd-place teams also advance</span>
      </div>
      </>
      )}

      {tab === 'scenarios' && (
        <div className="scenarios-container">
          <p className="dash-sub-desc" style={{ marginBottom: 20 }}>
            Key scenarios per group — what each team needs to advance, and the critical results to watch.
            Updated as matches are played.
          </p>
          {(activeGroup ? [activeGroup] : Object.keys(scenarioData.groups)).map(gId => (
            <ScenarioGroup key={gId} groupId={gId} data={scenarioData} />
          ))}
        </div>

      )}

      <p className="dash-disclaimer" style={{ marginTop: 24 }}>
        Group assignments are illustrative — verify with official FIFA sources.
        {source === 'live' ? ' Live standings via football-data.org.' : ' Standings update as matches are played.'}
        {' '}Cup Radar is not affiliated with FIFA.
      </p>
    </div>
  );
}
