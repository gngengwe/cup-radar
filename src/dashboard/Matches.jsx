import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useMatches } from '../hooks/useMatches';
import FlagImg from '../components/FlagImg';
import { daysUntilLabel } from '../utils/time';
import { getCityMeta, isHomeMatch, CITY_META } from '../utils/cityConfig';

const STATUS_LABELS = { scheduled: 'Scheduled', live: '● Live', finished: 'FT', postponed: 'PPD' };

// All city tags to show on a match row
const CITY_TAGS = Object.entries(CITY_META).map(([id, m]) => ({ id, short: m.short, flag: m.matchFlag }));

function LiveBadge({ source }) {
  if (source !== 'live') return null;
  return <span className="data-source-badge live">● Live data</span>;
}

function MatchRow({ match }) {
  const d       = new Date(match.date + 'T12:00:00');
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const isLive  = match.status === 'live';
  const isDone  = match.status === 'finished';
  const countdown = !isDone && !isLive ? daysUntilLabel(match.date) : null;

  const homeTag = CITY_TAGS.find(t => match[t.flag]);

  return (
    <div className={`match-row${homeTag ? ` ${homeTag.id}` : ''}${isLive ? ' live' : ''}`}>
      <div className="match-row__date">{dateStr}</div>
      <div className="match-row__teams">
        <span className="match-row__team home">
          <FlagImg emoji={match.homeFlag} size={16} />
          <span className="match-row__name">{match.homeTeam}</span>
        </span>
        <span className="match-row__score">
          {isDone || isLive
            ? `${match.homeScore ?? '–'} : ${match.awayScore ?? '–'}`
            : `${match.time} ${match.timezone}`}
        </span>
        <span className="match-row__team away">
          <span className="match-row__name">{match.awayTeam}</span>
          <FlagImg emoji={match.awayFlag} size={16} />
        </span>
      </div>
      <div className="match-row__meta">
        <span className="match-row__venue">{match.city}</span>
        {match.group && <span className="match-row__group">Grp {match.group}</span>}
        <span className={`match-row__status${isLive ? ' live' : ''}`}>
          {STATUS_LABELS[match.status] || match.status}
        </span>
        {homeTag && <span className="match-row__city-tag">{homeTag.short}</span>}
        {countdown && <span className="match-row__countdown">{countdown}</span>}
      </div>
    </div>
  );
}

export default function Matches() {
  const { city = 'seattle' }                       = useParams();
  const { matches, loading, error, source, refresh } = useMatches();
  const cityMeta = getCityMeta(city);

  const allCities  = useMemo(() => [...new Set(matches.map(m => m.city))].sort(), [matches]);
  const allStages  = useMemo(() => [...new Set(matches.map(m => m.stage))], [matches]);
  const allGroups  = useMemo(() => [...new Set(matches.map(m => m.group).filter(Boolean))].sort(), [matches]);

  const [homeOnly,    setHomeOnly]    = useState(true);
  const [cityFilter,  setCityFilter]  = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [search,      setSearch]      = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return matches.filter(m => {
      if (homeOnly && !isHomeMatch(m, city)) return false;
      if (cityFilter  !== 'all' && m.city  !== cityFilter)  return false;
      if (stageFilter !== 'all' && m.stage !== stageFilter) return false;
      if (groupFilter !== 'all' && m.group !== groupFilter) return false;
      if (q && !m.homeTeam.toLowerCase().includes(q) && !m.awayTeam.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [matches, homeOnly, city, cityFilter, stageFilter, groupFilter, search]);

  const grouped = useMemo(() => filtered.reduce((acc, m) => {
    if (!acc[m.date]) acc[m.date] = [];
    acc[m.date].push(m);
    return acc;
  }, {}), [filtered]);

  const homeCityLabel = `📍 ${cityMeta.label} only`;
  const filtersActive = !homeOnly || cityFilter !== 'all' || stageFilter !== 'all' || groupFilter !== 'all' || search;

  const resetFilters = () => {
    setHomeOnly(true); setCityFilter('all'); setStageFilter('all');
    setGroupFilter('all'); setSearch('');
  };

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">Match Tracker</h2>
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

      <div className="match-search-wrap">
        <input
          className="match-search"
          type="search"
          placeholder="Search by team name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search matches by team name"
        />
      </div>

      <div className="filter-bar">
        <button
          className={`filter-chip${homeOnly ? ' active' : ''}`}
          onClick={() => { setHomeOnly(v => !v); setCityFilter('all'); }}
        >{homeCityLabel}</button>

        <select className="filter-select" value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
          <option value="all">All stages</option>
          {allStages.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select className="filter-select" value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
          <option value="all">All groups</option>
          {allGroups.map(g => <option key={g} value={g}>Group {g}</option>)}
        </select>

        <select
          className="filter-select"
          value={cityFilter}
          onChange={e => { setCityFilter(e.target.value); if (e.target.value !== 'all') setHomeOnly(false); }}
        >
          <option value="all">All cities</option>
          {allCities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {filtersActive && (
          <button className="filter-clear" onClick={resetFilters} aria-label="Reset all filters to default">↺ Reset</button>
        )}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="empty-state">
          {filtersActive
            ? <>No matches match the current filters.{' '}
                <button className="api-retry-btn" onClick={resetFilters}>Clear filters</button>
              </>
            : 'No matches available.'}
        </div>
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
        Match times in local venue timezone. Verify kickoff times with official FIFA sources.
        {source === 'live' && ' Live data via football-data.org.'}
        {' '}Cup Radar is not affiliated with FIFA.
      </p>
    </div>
  );
}
