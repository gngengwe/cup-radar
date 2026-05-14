import { useState, useMemo } from 'react';
import { useMatches } from '../hooks/useMatches';

const STATUS_LABELS = { scheduled: 'Scheduled', live: '● Live', finished: 'FT', postponed: 'PPD' };

function LiveBadge({ source }) {
  if (source !== 'live') return null;
  return <span className="data-source-badge live">● Live data</span>;
}

function MatchRow({ match }) {
  const d       = new Date(match.date + 'T12:00:00');
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const isLive  = match.status === 'live';
  const isDone  = match.status === 'finished';

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
            : `${match.time} ${match.timezone}`}
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
  const { matches, loading, error, source, refresh } = useMatches();

  const allCities  = useMemo(() => [...new Set(matches.map(m => m.city))].sort(), [matches]);
  const allStages  = useMemo(() => [...new Set(matches.map(m => m.stage))], [matches]);
  const allGroups  = useMemo(() => [...new Set(matches.map(m => m.group).filter(Boolean))].sort(), [matches]);

  const [cityFilter,  setCityFilter]  = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [seaOnly,     setSeaOnly]     = useState(false);

  const filtered = useMemo(() => matches.filter(m => {
    if (seaOnly && !m.seattleMatch)                      return false;
    if (cityFilter  !== 'all' && m.city  !== cityFilter)  return false;
    if (stageFilter !== 'all' && m.stage !== stageFilter) return false;
    if (groupFilter !== 'all' && m.group !== groupFilter) return false;
    return true;
  }), [matches, seaOnly, cityFilter, stageFilter, groupFilter]);

  const grouped = useMemo(() => filtered.reduce((acc, m) => {
    if (!acc[m.date]) acc[m.date] = [];
    acc[m.date].push(m);
    return acc;
  }, {}), [filtered]);

  const filtersActive = seaOnly || cityFilter !== 'all' || stageFilter !== 'all' || groupFilter !== 'all';

  return (
    <div>
      <div className="dash-section-header">
        <h1 className="dash-section-title">Match Tracker</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LiveBadge source={source} />
          {loading && <span className="loading-dot" />}
          <span className="dash-last-updated">{matches.length} matches</span>
        </div>
      </div>

      {error && (
        <div className="api-error-bar">
          Live data unavailable — showing local data.
          <button onClick={refresh} className="api-retry-btn">Retry</button>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="filter-bar">
        <button
          className={`filter-chip${seaOnly ? ' active' : ''}`}
          onClick={() => setSeaOnly(v => !v)}
        >🏟️ Seattle only</button>

        <select className="filter-select" value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
          <option value="all">All stages</option>
          {allStages.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select className="filter-select" value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
          <option value="all">All groups</option>
          {allGroups.map(g => <option key={g} value={g}>Group {g}</option>)}
        </select>

        <select className="filter-select" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
          <option value="all">All cities</option>
          {allCities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {filtersActive && (
          <button className="filter-clear" onClick={() => {
            setCityFilter('all'); setStageFilter('all'); setGroupFilter('all'); setSeaOnly(false);
          }}>Clear</button>
        )}
      </div>

      {/* ── Match list ── */}
      {Object.keys(grouped).length === 0 ? (
        <div className="empty-state">No matches match the current filters.</div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, ms]) => {
            const label = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
            });
            return (
              <div key={date} className="match-date-group">
                <div className="match-date-group__header">{label}</div>
                {ms.map(m => <MatchRow key={m.id} match={m} />)}
              </div>
            );
          })
      )}

      <p className="dash-disclaimer">
        Match times displayed in PT (local Seattle time). Verify kickoff times with official FIFA sources.
        Cup Radar is not affiliated with FIFA.{' '}
        {source === 'live' && 'Live data via football-data.org.'}
      </p>
    </div>
  );
}
