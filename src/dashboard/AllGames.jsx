import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useMatches } from '../hooks/useMatches';
import FlagImg from '../components/FlagImg';
import JerseyDisplay from '../components/JerseyDisplay';
import { getJersey } from '../utils/teamData';
import { daysUntilLabel, matchKickoffISO, liveCountdown } from '../utils/time';
import { fetchEspnScoreboard, matchEspnStatus } from '../api/espnScoreboard';
import { useMatchExcitement } from '../hooks/useMatchExcitement';
import { ExcitementMeter } from '../components/ExcitementMeter';
import { MatchExcitementBadges } from '../components/MatchExcitementBadges';
import { CITY_META, getCityMeta, isHomeMatch } from '../utils/cityConfig';
import { buildSearchParams, readBooleanSearchParam, readSearchParam } from '../utils/searchParams';

const OFFICIAL_MATCH_COUNT = 104;
const STATUS_LABELS = {
  scheduled: 'Scheduled',
  live: 'Live',
  finished: 'FT',
  postponed: 'PPD',
};

const STATUS_ORDER = ['live', 'scheduled', 'finished', 'postponed'];
const CITY_TAGS = Object.entries(CITY_META).map(([id, meta]) => ({
  id,
  short: meta.short,
  flag: meta.matchFlag,
}));
const TIMEZONE_OFFSET_MINUTES = {
  ET: 240,
  CT: 300,
  MT: 360,
  PT: 420,
  UTC: 0,
  GMT: 0,
};

function kickoffSortValue(match) {
  const [hours = '0', minutes = '0'] = (match.time || '00:00').split(':');
  const localMinutes = (Number(hours) * 60) + Number(minutes);
  const offsetMinutes = TIMEZONE_OFFSET_MINUTES[match.timezone] ?? 0;
  return localMinutes + offsetMinutes;
}

function compareMatches(a, b) {
  return kickoffSortValue(a) - kickoffSortValue(b)
    || a.city.localeCompare(b.city)
    || (a.venue || '').localeCompare(b.venue || '')
    || a.homeTeam.localeCompare(b.homeTeam)
    || a.awayTeam.localeCompare(b.awayTeam);
}

function LiveBadge({ source }) {
  if (source !== 'live') return null;
  return <span className="data-source-badge live">Live data</span>;
}

function MatchRow({ match, currentCity }) {
  const dateObj = new Date(`${match.date}T12:00:00`);
  const dateStr = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const isLive = match.status === 'live';
  const isDone = match.status === 'finished';
  const countdown = !isDone && !isLive ? daysUntilLabel(match.date) : null;
  const homeTag = CITY_TAGS.find(tag => match[tag.flag]);
  const currentCityTag = CITY_TAGS.find(tag => tag.id === currentCity && match[tag.flag]);

  return (
    <div className={`match-row${homeTag ? ` ${homeTag.id}` : ''}${isLive ? ' live' : ''}`}>
      <div className="match-row__date">
        <span className="match-row__date-main">{dateStr}</span>
      </div>
      <div className="match-row__teams">
        <span className="match-row__team home">
          <FlagImg emoji={match.homeFlag} size={16} />
          <span className="match-row__name">{match.homeTeam}</span>
        </span>
        <span className="match-row__score">
          {isDone || isLive
            ? `${match.homeScore ?? '-'} : ${match.awayScore ?? '-'}`
            : `${match.time} ${match.timezone}`}
        </span>
        <span className="match-row__team away">
          <span className="match-row__name">{match.awayTeam}</span>
          <FlagImg emoji={match.awayFlag} size={16} />
        </span>
      </div>
      <div className="match-row__details">
        <div className="match-row__location">
          <span className="match-row__city">{match.city}</span>
          {match.venue && <span className="match-row__venue">{match.venue}</span>}
        </div>
        <div className="match-row__meta">
          {match.stage && <span className="match-row__group">{match.stage}</span>}
          {match.group && <span className="match-row__group">Group {match.group}</span>}
          <span className={`match-row__status${isLive ? ' live' : ''}`}>
            {STATUS_LABELS[match.status] || match.status}
          </span>
          {currentCityTag && <span className="match-row__city-tag">{currentCityTag.short} host</span>}
          {countdown && <span className="match-row__countdown">{countdown}</span>}
        </div>
      </div>
    </div>
  );
}

function MatchDayCard({ match, espn }) {
  const countdown = liveCountdown(matchKickoffISO(match));
  const isLive    = espn?.state === 'in';
  const { excitement, badges } = useMatchExcitement(match, espn);

  let status;
  if (espn?.state === 'post') {
    status = `FINAL · ${match.homeTeam} ${espn.homeScore}–${espn.awayScore} ${match.awayTeam}`;
  } else if (isLive) {
    status = `🔴 LIVE ${espn.clock} · ${match.homeTeam} ${espn.homeScore}–${espn.awayScore} ${match.awayTeam}`;
  } else if (match.status === 'finished') {
    status = `FINAL · ${match.homeTeam} ${match.homeScore}–${match.awayScore} ${match.awayTeam}`;
  } else if (countdown) {
    status = `Kicks off in ${countdown}`;
  } else {
    status = '🔴 Live now — check back for the score';
  }

  return (
    <div className={`allgames-matchday-card${isLive ? ' live' : ''}`}>
      <div className="allgames-matchday-card__matchup">
        {(getJersey(match.homeCode) || getJersey(match.awayCode)) ? (
          <>
            <div className="hq-jersey-team">
              {getJersey(match.homeCode)
                ? <JerseyDisplay colors={getJersey(match.homeCode).colors} pattern={getJersey(match.homeCode).pattern} size={44} />
                : <FlagImg emoji={match.homeFlag} size={24} />}
              <span className="hq-jersey-team__name">{match.homeTeam}</span>
            </div>
            <span className="hq-jersey-vs">vs</span>
            <div className="hq-jersey-team">
              {getJersey(match.awayCode)
                ? <JerseyDisplay colors={getJersey(match.awayCode).colors} pattern={getJersey(match.awayCode).pattern} size={44} />
                : <FlagImg emoji={match.awayFlag} size={24} />}
              <span className="hq-jersey-team__name">{match.awayTeam}</span>
            </div>
          </>
        ) : (
          <>
            <FlagImg emoji={match.homeFlag} size={20} />
            <strong>{match.homeTeam}</strong>
            <span className="hq-jersey-vs">vs</span>
            <strong>{match.awayTeam}</strong>
            <FlagImg emoji={match.awayFlag} size={20} />
          </>
        )}
      </div>
      <div className="allgames-matchday-card__status">{status}</div>
      {isLive && excitement && (
        <>
          <ExcitementMeter excitement={excitement} compact />
          <MatchExcitementBadges badges={badges} />
        </>
      )}
      <div className="allgames-matchday-card__meta">
        {match.time} {match.timezone} · {match.city}
        {match.group && ` · Group ${match.group}`}
        {match.stage && match.stage !== 'Group Stage' && ` · ${match.stage}`}
      </div>
    </div>
  );
}

export default function AllGames() {
  const { city = 'seattle' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { matches, loading, error, source, refresh } = useMatches();
  const cityMeta = getCityMeta(city);
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const deferredSearch = useDeferredValue(search);
  const searchQuery = deferredSearch.toLowerCase().trim();

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const todayMatches = useMemo(
    () => matches.filter(match => match.date === todayStr).sort(compareMatches),
    [matches, todayStr]
  );

  const [espnByMatchId, setEspnByMatchId] = useState({});

  useEffect(() => {
    if (todayMatches.length === 0) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const events = await fetchEspnScoreboard(todayStr);
        if (cancelled) return;
        const next = {};
        for (const match of todayMatches) {
          next[match.id] = matchEspnStatus(events, match);
        }
        setEspnByMatchId(next);
      } catch {
        // fail soft — cards fall back to local match.status
      }
    };

    tick();
    const id = setInterval(tick, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [todayStr, todayMatches]);

  const allCities = useMemo(
    () => [...new Set(matches.map(match => match.city).filter(Boolean))].sort(),
    [matches]
  );
  const allCountries = useMemo(
    () => [...new Set(matches.flatMap(match => [match.homeTeam, match.awayTeam]).filter(Boolean))].sort(),
    [matches]
  );
  const allStages = useMemo(
    () => [...new Set(matches.map(match => match.stage).filter(Boolean))],
    [matches]
  );
  const allGroups = useMemo(
    () => [...new Set(matches.map(match => match.group).filter(Boolean))].sort(),
    [matches]
  );
  const allStatuses = useMemo(() => {
    const discovered = [...new Set(matches.map(match => match.status).filter(Boolean))];
    return discovered.sort((a, b) => {
      const aIndex = STATUS_ORDER.indexOf(a);
      const bIndex = STATUS_ORDER.indexOf(b);
      const aRank = aIndex === -1 ? STATUS_ORDER.length : aIndex;
      const bRank = bIndex === -1 ? STATUS_ORDER.length : bIndex;
      return aRank - bRank || a.localeCompare(b);
    });
  }, [matches]);

  const rawCountryFilter = readSearchParam(searchParams, 'country', 'all');
  const rawCityFilter = readSearchParam(searchParams, 'matchCity', 'all');
  const rawStageFilter = readSearchParam(searchParams, 'stage', 'all');
  const rawGroupFilter = readSearchParam(searchParams, 'group', 'all');
  const rawStatusFilter = readSearchParam(searchParams, 'status', 'all');
  const hostCityOnly = readBooleanSearchParam(searchParams, 'host');
  const countryFilter = rawCountryFilter === 'all' || allCountries.includes(rawCountryFilter) ? rawCountryFilter : 'all';
  const cityFilter = rawCityFilter === 'all' || allCities.includes(rawCityFilter) ? rawCityFilter : 'all';
  const stageFilter = rawStageFilter === 'all' || allStages.includes(rawStageFilter) ? rawStageFilter : 'all';
  const groupFilter = rawGroupFilter === 'all' || allGroups.includes(rawGroupFilter) ? rawGroupFilter : 'all';
  const statusFilter = rawStatusFilter === 'all' || allStatuses.includes(rawStatusFilter) ? rawStatusFilter : 'all';

  useEffect(() => {
    const urlSearch = searchParams.get('q') || '';
    setSearch(current => (current === urlSearch ? current : urlSearch));
  }, [searchParams]);

  useEffect(() => {
    const currentQuery = searchParams.get('q') || '';
    if (searchQuery === currentQuery) return;

    setSearchParams(buildSearchParams(searchParams, { q: searchQuery }), { replace: true });
  }, [searchParams, searchQuery, setSearchParams]);

  const updateParams = updates => {
    setSearchParams(buildSearchParams(searchParams, updates), { replace: true });
  };

  const filtered = useMemo(() => {
    return matches.filter(match => {
      if (hostCityOnly && !isHomeMatch(match, city)) return false;
      if (countryFilter !== 'all' && match.homeTeam !== countryFilter && match.awayTeam !== countryFilter) return false;
      if (cityFilter !== 'all' && match.city !== cityFilter) return false;
      if (stageFilter !== 'all' && match.stage !== stageFilter) return false;
      if (groupFilter !== 'all' && match.group !== groupFilter) return false;
      if (statusFilter !== 'all' && match.status !== statusFilter) return false;

      if (searchQuery) {
        const haystack = [
          match.homeTeam,
          match.awayTeam,
          match.city,
          match.venue,
          match.stage,
          match.group ? `group ${match.group}` : null,
          match.notes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(searchQuery)) return false;
      }

      return true;
    });
  }, [matches, hostCityOnly, city, countryFilter, cityFilter, stageFilter, groupFilter, searchQuery, statusFilter]);

  const sortedFiltered = useMemo(
    () => [...filtered].sort((a, b) => a.date.localeCompare(b.date) || compareMatches(a, b)),
    [filtered]
  );

  const groupedMatches = useMemo(
    () => sortedFiltered.reduce((acc, match) => {
      if (!acc[match.date]) acc[match.date] = [];
      acc[match.date].push(match);
      return acc;
    }, {}),
    [sortedFiltered]
  );

  const hostCityCount = useMemo(
    () => matches.filter(match => isHomeMatch(match, city)).length,
    [matches, city]
  );
  const liveCount = useMemo(
    () => matches.filter(match => match.status === 'live').length,
    [matches]
  );
  const filtersActive = hostCityOnly
    || countryFilter !== 'all'
    || cityFilter !== 'all'
    || stageFilter !== 'all'
    || groupFilter !== 'all'
    || statusFilter !== 'all'
    || search.trim();

  const resetFilters = () => {
    setSearch('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const coverageMessage = matches.length === OFFICIAL_MATCH_COUNT
    ? 'Full 104-match tournament schedule is loaded in this feed.'
    : `This feed currently shows ${matches.length} of ${OFFICIAL_MATCH_COUNT} official matches. Double-check missing fixtures against FIFA before publishing.`;

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">All Games</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LiveBadge source={source} />
          {loading && <span className="loading-dot" />}
          <span className="dash-last-updated">{matches.length} loaded</span>
        </div>
      </div>

      <p className="wc-page-note">
        Tournament-wide fixture board with search and filters across teams, cities, stages, groups,
        and live status.
      </p>

      {todayMatches.length > 0 && (
        <div className="dash-sub-section">
          <h3 className="dash-sub-heading">
            🔴 Match Day — {todayMatches.length} {todayMatches.length === 1 ? 'game' : 'games'} today
          </h3>
          <div className="allgames-matchday-grid">
            {todayMatches.map(match => (
              <MatchDayCard key={match.id} match={match} espn={espnByMatchId[match.id]} />
            ))}
          </div>
        </div>
      )}

      <div className="wc-overview-grid">
        <div className="card wc-overview-card">
          <span className="wc-overview-card__label">Loaded</span>
          <strong className="wc-overview-card__value">{matches.length}</strong>
          <span className="wc-overview-card__sub">Official total: {OFFICIAL_MATCH_COUNT}</span>
        </div>
        <div className="card wc-overview-card">
          <span className="wc-overview-card__label">Visible</span>
          <strong className="wc-overview-card__value">{filtered.length}</strong>
          <span className="wc-overview-card__sub">After current filters</span>
        </div>
        <div className="card wc-overview-card">
          <span className="wc-overview-card__label">{cityMeta.label}</span>
          <strong className="wc-overview-card__value">{hostCityCount}</strong>
          <span className="wc-overview-card__sub">Host-city matches in feed</span>
        </div>
        <div className="card wc-overview-card">
          <span className="wc-overview-card__label">Live Now</span>
          <strong className="wc-overview-card__value">{liveCount}</strong>
          <span className="wc-overview-card__sub">{allCities.length} cities represented</span>
        </div>
      </div>

      {error && (
        <div className="api-error-bar">
          Live data unavailable - showing local data.
          <button onClick={refresh} className="api-retry-btn">Retry</button>
        </div>
      )}

      <div className="match-search-wrap">
        <input
          className="match-search"
          type="search"
          placeholder="Search countries, city, venue, stage..."
          value={search}
          onChange={event => setSearch(event.target.value)}
          aria-label="Search all games"
        />
      </div>

      <div className="filter-bar">
        <button
          className={`filter-chip${hostCityOnly ? ' active' : ''}`}
          onClick={() => {
            const nextHostCityOnly = !hostCityOnly;
            updateParams({
              host: nextHostCityOnly,
              matchCity: nextHostCityOnly ? null : cityFilter,
            });
          }}
        >
          {cityMeta.label} host city only
        </button>

        <select
          className="filter-select"
          value={countryFilter}
          onChange={event => updateParams({ country: event.target.value })}
          aria-label="Filter by country"
        >
          <option value="all">All countries</option>
          {allCountries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={stageFilter}
          onChange={event => updateParams({ stage: event.target.value })}
          aria-label="Filter by stage"
        >
          <option value="all">All stages</option>
          {allStages.map(stage => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={groupFilter}
          onChange={event => updateParams({ group: event.target.value })}
          aria-label="Filter by group"
        >
          <option value="all">All groups</option>
          {allGroups.map(group => (
            <option key={group} value={group}>Group {group}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={cityFilter}
          onChange={event => {
            updateParams({
              matchCity: event.target.value,
              host: event.target.value !== 'all' ? null : hostCityOnly,
            });
          }}
          aria-label="Filter by city"
        >
          <option value="all">All cities</option>
          {allCities.map(matchCity => (
            <option key={matchCity} value={matchCity}>{matchCity}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={event => updateParams({ status: event.target.value })}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {allStatuses.map(status => (
            <option key={status} value={status}>{STATUS_LABELS[status] || status}</option>
          ))}
        </select>

        {filtersActive && (
          <button
            className="filter-clear"
            onClick={resetFilters}
            aria-label="Reset all filters to default"
          >
            Reset
          </button>
        )}
      </div>

      <p className="wc-inline-note">
        {coverageMessage} Filters persist in the URL for refresh and sharing.
      </p>

      {Object.keys(groupedMatches).length === 0 ? (
        <div className="empty-state">
          {filtersActive
            ? <>No matches match the current filters. <button className="api-retry-btn" onClick={resetFilters}>Clear filters</button></>
            : 'No matches available.'}
        </div>
      ) : (
        Object.entries(groupedMatches)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, dayMatches]) => {
            const label = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            });

            return (
              <div key={date} className="match-date-group">
                <div className="match-date-group__header">{label}</div>
                {dayMatches.map(match => (
                  <MatchRow key={match.id} match={match} currentCity={city} />
                ))}
              </div>
            );
          })
      )}

      <p className="dash-disclaimer">
        Match times are shown in the venue&apos;s local timezone. Verify kickoff changes, final host
        assignments, and knockout pairings with official FIFA sources before publishing.
        {source === 'live' && ' Live score updates are supplied through football-data.org.'}
        {' '}Cup Radar is not affiliated with FIFA.
      </p>
    </div>
  );
}
