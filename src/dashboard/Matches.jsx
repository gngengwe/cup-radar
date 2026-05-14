import { useState, useMemo } from 'react';
import matchData from '../data/matches.json';

const ALL_CITIES  = [...new Set(matchData.matches.map(m => m.city))].sort();
const ALL_STAGES  = [...new Set(matchData.matches.map(m => m.stage))];
const ALL_GROUPS  = [...new Set(matchData.matches.map(m => m.group).filter(Boolean))].sort();

const STATUS_LABELS = { scheduled: 'Scheduled', live: '● Live', finished: 'FT', postponed: 'PPD' };

function MatchRow({ match }) {
  const d = new Date(match.date + 'T12:00:00');
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const isLive = match.status === 'live';
  const isDone = match.status === 'finished';

  return (
    <div className={`match-row${match.seattleMatch ? ' seattle' : ''}${isLive ? ' live' : ''}`}>
      <div className="match-row__date">{dateStr}</div>
      <div className="match-row__teams">
        <span className="match-row__team home">
          <span className="match-row__flag">{match.homeFlag}</span>
          <span className="match-row__name">{match.homeTeam}</span>
        </span>
        <span className="match-row__score">
          {isDone || isLive
            ? `${match.homeScore ?? '–'} : ${match.awayScore ?? '–'}`
            : match.time + ' ' + match.timezone}
        </span>
        <span className="match-row__team away">
          <span className="match-row__name">{match.awayTeam}</span>
          <span className="match-row__flag">{match.awayFlag}</span>
        </span>
      </div>
      <div className="match-row__meta">
        <span className="match-row__venue">{match.city}</span>
        {match.group && <span className="match-row__group">Grp {match.group}</span>}
        <span className={`match-row__status${isLive ? ' live' : ''}`}>
          {STATUS_LABELS[match.status] || match.status}
        </span>
        {match.seattleMatch && <span className="match-row__seattle-tag">SEA</span>}
      </div>
    </div>
  );
}

export default function Matches() {
  const [cityFilter,  setCityFilter]  = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [seaOnly,     setSeaOnly]     = useState(false);

  const filtered = useMemo(() => {
    return matchData.matches.filter(m => {
      if (seaOnly && !m.seattleMatch)   return false;
      if (cityFilter  !== 'all' && m.city  !== cityFilter)  return false;
      if (stageFilter !== 'all' && m.stage !== stageFilter) return false;
      if (groupFilter !== 'all' && m.group !== groupFilter) return false;
      return true;
    });
  }, [cityFilter, stageFilter, groupFilter, seaOnly]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc, m) => {
      const key = m.date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {});
  }, [filtered]);

  const lastUpdated = new Date(matchData.matches[0]?.date ?? Date.now()).toLocaleDateString();

  return (
    <div>
      <div className="dash-section-header">
        <h1 className="dash-section-title">Match Tracker</h1>
        <span className="dash-last-updated">{matchData.matches.length} matches</span>
      </div>

      {/* ── Filters ── */}
      <div className="filter-bar">
        <button
          className={`filter-chip${seaOnly ? ' active' : ''}`}
          onClick={() => setSeaOnly(v => !v)}
        >
          🏟️ Seattle only
        </button>

        <select
          className="filter-select"
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
        >
          <option value="all">All stages</option>
          {ALL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          className="filter-select"
          value={groupFilter}
          onChange={e => setGroupFilter(e.target.value)}
        >
          <option value="all">All groups</option>
          {ALL_GROUPS.map(g => <option key={g} value={g}>Group {g}</option>)}
        </select>

        <select
          className="filter-select"
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
        >
          <option value="all">All cities</option>
          {ALL_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {(seaOnly || cityFilter !== 'all' || stageFilter !== 'all' || groupFilter !== 'all') && (
          <button className="filter-clear" onClick={() => { setCityFilter('all'); setStageFilter('all'); setGroupFilter('all'); setSeaOnly(false); }}>
            Clear filters
          </button>
        )}
      </div>

      {/* ── Matches ── */}
      {Object.keys(grouped).length === 0 ? (
        <div className="empty-state">No matches match the current filters.</div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, ms]) => {
            const d = new Date(date + 'T12:00:00');
            const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            return (
              <div key={date} className="match-date-group">
                <div className="match-date-group__header">{label}</div>
                {ms.map(m => <MatchRow key={m.id} match={m} />)}
              </div>
            );
          })
      )}

      <p className="dash-disclaimer">
        Match times are local to each venue. Verify kickoff times with official FIFA sources.
        Cup Radar is not affiliated with FIFA.
      </p>
    </div>
  );
}
