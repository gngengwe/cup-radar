import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FlagImg from '../components/FlagImg';
import JerseyDisplay from '../components/JerseyDisplay';
import { getJersey } from '../utils/teamData';
import cultureData from '../data/culture.json';
import { buildSearchParams, readSearchParam } from '../utils/searchParams';

const KIT_TYPE_CONFIG = {
  kit:   { label: 'Kit',   icon: '👕', color: 'var(--accent)' },
  merch: { label: 'Merch', icon: '🛍️', color: '#ffb84d' },
};

const KITS_BY_CODE = cultureData.items
  .filter(item => item.type === 'kit' && item.teamCode)
  .reduce((map, item) => {
    (map[item.teamCode] ||= []).push(item);
    return map;
  }, {});

function KitRatingStars({ rating }) {
  return (
    <div className="culture-rating">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`star${i < rating ? ' active' : ''}`}>★</span>
      ))}
    </div>
  );
}

const STATUS_META = {
  'updated-before-opener': {
    badgeLabel: 'Updated',
    longLabel: 'Updated Before Opener',
  },
  'selection-watch': {
    badgeLabel: 'Selection Watch',
    longLabel: 'Selection Watch',
  },
  'clear-no-change-located': {
    badgeLabel: 'No Change',
    longLabel: 'No Change Located',
  },
};
const VALID_STATUSES = Object.keys(STATUS_META);
const EMPTY_POSITION_COUNTS = { GK: 0, DF: 0, MF: 0, FW: 0 };

function formatDate(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function TeamStatusBadge({ status }) {
  const meta = STATUS_META[status] || {
    badgeLabel: 'Status Unknown',
    longLabel: 'Status Unknown',
  };

  return (
    <span
      className={`wc-status-badge wc-status-badge--${status || 'unknown'}`}
      title={meta.longLabel}
      aria-label={meta.longLabel}
    >
      {meta.badgeLabel}
    </span>
  );
}

function buildPositionPills(positionCounts = {}) {
  return [
    ['GK', 'GK'],
    ['DF', 'DF'],
    ['MF', 'MF'],
    ['FW', 'FW'],
  ]
    .filter(([code]) => positionCounts[code] > 0)
    .map(([code, label]) => `${positionCounts[code]} ${label}`);
}

function TeamCard({ team, expandSquad }) {
  const [isSquadOpen, setIsSquadOpen] = useState(expandSquad);

  useEffect(() => {
    if (expandSquad) setIsSquadOpen(true);
  }, [expandSquad]);

  const allSources = team.sources?.length
    ? team.sources
      : team.fifaSquadUrl
      ? [{
          kind: 'official_fifa_squad',
          title: 'FIFA World Cup 2026: Squad List',
          publisher: 'FIFA',
          url: team.fifaSquadUrl,
        }]
      : [];

  return (
    <article className="card wc-team-card">
      <div className="wc-team-card__top">
        <div className="wc-team-card__identity">
          <FlagImg emoji={team.flag} size={24} />
          <div>
            <h3 className="wc-team-card__name">{team.name}</h3>
            <div className="wc-team-card__meta">
              <span>{team.code}</span>
              <span>Group {team.group}</span>
            </div>
          </div>
        </div>
        <TeamStatusBadge status={team.status} />
      </div>

      <div className="wc-team-card__body">
        {KITS_BY_CODE[team.code]?.length > 0 && (
          <div className="wc-team-block">
            <div className="wc-team-block__label">Kit &amp; Identity</div>
            <div className="wc-team-kits">
              {KITS_BY_CODE[team.code].map(kit => {
                const typeCfg = KIT_TYPE_CONFIG[kit.type] || KIT_TYPE_CONFIG.kit;
                const jersey = getJersey(team.code);
                return (
                  <div key={kit.id} className="culture-card wc-team-kit">
                    <div className="culture-card__top">
                      <span className="culture-card__type" style={{ color: typeCfg.color }}>
                        {typeCfg.icon} {typeCfg.label}
                      </span>
                      {kit.rating && <KitRatingStars rating={kit.rating} />}
                    </div>
                    {jersey && (
                      <div className="culture-card__jersey">
                        <JerseyDisplay colors={jersey.colors} pattern={jersey.pattern} size={56} />
                      </div>
                    )}
                    <div className="culture-card__title">{kit.title}</div>
                    <div className="culture-card__desc">{kit.description}</div>
                    <div className="culture-card__footer">
                      <span className="culture-card__price">{kit.price}</span>
                      <div className="culture-card__tags">
                        {kit.tags?.map(tag => (
                          <span key={tag} className="culture-card__tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {team.knownChanges?.length > 0 && (
          <div className="wc-team-block">
            <div className="wc-team-block__label">Roster updates</div>
            <ul className="wc-note-list">
              {team.knownChanges.map((change, idx) => (
                <li key={`${team.code}-change-${idx}`}>
                  {change.playerOut && <strong>Out:</strong>} {change.playerOut || 'N/A'}
                  {change.playerIn && <> <strong>In:</strong> {change.playerIn}</>}
                  {change.reason && <> <span className="wc-note-sep">&middot;</span> {change.reason}</>}
                  {change.date && <> <span className="wc-note-sep">&middot;</span> {formatDate(change.date)}</>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {team.notableAbsences?.length > 0 && (
          <div className="wc-team-block">
            <div className="wc-team-block__label">Notable absences</div>
            <ul className="wc-note-list">
              {team.notableAbsences.map((absence, idx) => (
                <li key={`${team.code}-absence-${idx}`}>
                  <strong>{absence.player}</strong> {absence.reason}
                  {absence.date && <> <span className="wc-note-sep">&middot;</span> {formatDate(absence.date)}</>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {team.selectionNotes?.length > 0 && (
          <div className="wc-team-block">
            <div className="wc-team-block__label">Selection notes</div>
            <ul className="wc-note-list">
              {team.selectionNotes.map((note, idx) => (
                <li key={`${team.code}-note-${idx}`}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {!team.knownChanges?.length && !team.notableAbsences?.length && !team.selectionNotes?.length && (
          <p className="wc-team-card__clear-note">
            No pre-opener injury replacement or notable squad omission is attached to this team entry.
          </p>
        )}

        {team.players?.length > 0 && (
          <div className="wc-team-block">
            <details
              className="wc-squad-details"
              open={isSquadOpen}
              onToggle={event => setIsSquadOpen(event.currentTarget.open)}
            >
              <summary className="wc-squad-summary">
                <span className="wc-squad-summary__title">Full squad</span>
                <span className="wc-squad-summary__meta">{team.playerCount} players</span>
              </summary>

              {isSquadOpen && (
                <>
                  <div className="wc-squad-pills">
                    {buildPositionPills(team.positionCounts).map(pill => (
                      <span key={`${team.code}-${pill}`} className="wc-squad-pill">{pill}</span>
                    ))}
                  </div>

                  <div className="wc-player-list">
                    {team.players.map(player => (
                      <div key={`${team.code}-${player.number}`} className="wc-player-row">
                        <span className="wc-player-row__num">{player.number}</span>
                        <span className="wc-player-row__position">{player.positionCode}</span>
                        <span className="wc-player-row__name">{player.displayName || player.listingName}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </details>
          </div>
        )}

        <div className="wc-team-block">
          <div className="wc-team-block__label">Sources</div>
          <div className="wc-source-list">
            {allSources.map((source, idx) => (
              <div key={`${team.code}-source-${idx}`} className="wc-source-item">
                <span className="wc-source-item__title">
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.title || source.publisher}
                    </a>
                  ) : (
                    source.title || source.publisher
                  )}
                </span>
                <span className="wc-source-item__meta">
                  {source.publisher}
                  {source.date && <> <span className="wc-note-sep">&middot;</span> {formatDate(source.date)}</>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AllTeams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [dataState, setDataState] = useState({
    loading: true,
    error: null,
    data: null,
  });
  const [reloadSeed, setReloadSeed] = useState(0);
  const deferredSearch = useDeferredValue(search);
  const searchQuery = deferredSearch.toLowerCase().trim();

  useEffect(() => {
    let active = true;

    setDataState(current => ({
      ...current,
      loading: true,
      error: null,
    }));

    Promise.all([
      import('../data/groups.json'),
      import('../data/world-cup-sources.json'),
      import('../data/world-cup-availability.json'),
      import('../data/world-cup-squads.json'),
    ])
      .then(([groupsModule, sourcesModule, availabilityModule, squadsModule]) => {
        if (!active) return;

        setDataState({
          loading: false,
          error: null,
          data: {
            groupsData: groupsModule.default,
            sourcesData: sourcesModule.default,
            availabilityData: availabilityModule.default,
            squadsData: squadsModule.default,
          },
        });
      })
      .catch(error => {
        if (!active) return;

        const message = error instanceof Error ? error.message : 'Could not load team data.';
        setDataState(current => ({
          ...current,
          loading: false,
          error: message,
        }));
      });

    return () => {
      active = false;
    };
  }, [reloadSeed]);

  useEffect(() => {
    const urlSearch = searchParams.get('q') || '';
    setSearch(current => (current === urlSearch ? current : urlSearch));
  }, [searchParams]);

  useEffect(() => {
    const currentQuery = searchParams.get('q') || '';
    if (searchQuery === currentQuery) return;

    setSearchParams(buildSearchParams(searchParams, { q: searchQuery }), { replace: true });
  }, [searchParams, searchQuery, setSearchParams]);

  const groupsData = dataState.data?.groupsData;
  const sourcesData = dataState.data?.sourcesData;
  const availabilityData = dataState.data?.availabilityData;
  const squadsData = dataState.data?.squadsData;
  const groups = groupsData?.groups || [];

  const officialSourceMap = useMemo(
    () => new Map((sourcesData?.fifaSquadPdfPages || []).map(entry => [entry.code, entry])),
    [sourcesData]
  );

  const squadsMap = useMemo(
    () => new Map((squadsData?.teams || []).map(entry => [entry.code, entry])),
    [squadsData]
  );

  const availabilityMap = useMemo(
    () => new Map((availabilityData?.teams || []).map(entry => [entry.code, entry])),
    [availabilityData]
  );

  const teams = useMemo(() => (
    groups
      .flatMap(group => group.teams.map(team => {
        const availability = availabilityMap.get(team.code);
        const official = officialSourceMap.get(team.code);
        const squad = squadsMap.get(team.code);
        const fifaSquadPdfPage = squad?.page || availability?.fifaSquadPdfPage || official?.page || null;

        return {
          ...team,
          group: group.id,
          status: availability?.status || 'clear-no-change-located',
          knownChanges: availability?.knownChanges || [],
          notableAbsences: availability?.notableAbsences || [],
          selectionNotes: availability?.selectionNotes || [],
          players: squad?.players || [],
          playerCount: squad?.playerCount || 0,
          positionCounts: squad?.positionCounts || EMPTY_POSITION_COUNTS,
          sources: availability?.sources || [],
          fifaSquadPdfPage,
          fifaSquadUrl: fifaSquadPdfPage
            ? `${sourcesData?.globalSources?.squads?.url}#page=${fifaSquadPdfPage}`
            : null,
        };
      }))
      .sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name))
  ), [availabilityMap, groups, officialSourceMap, sourcesData, squadsMap]);

  const allCountries = useMemo(
    () => teams.map(team => team.name).sort((a, b) => a.localeCompare(b)),
    [teams]
  );
  const allGroupIds = useMemo(
    () => groups.map(group => group.id),
    [groups]
  );

  const rawCountryFilter = readSearchParam(searchParams, 'country', 'all');
  const rawGroupFilter = readSearchParam(searchParams, 'group', 'all');
  const rawStatusFilter = readSearchParam(searchParams, 'status', 'all');
  const countryFilter = rawCountryFilter === 'all' || allCountries.includes(rawCountryFilter) ? rawCountryFilter : 'all';
  const groupFilter = rawGroupFilter === 'all' || allGroupIds.includes(rawGroupFilter) ? rawGroupFilter : 'all';
  const statusFilter = rawStatusFilter === 'all' || VALID_STATUSES.includes(rawStatusFilter) ? rawStatusFilter : 'all';

  const updateParams = updates => {
    setSearchParams(buildSearchParams(searchParams, updates), { replace: true });
  };

  const filtered = useMemo(() => {
    return teams.filter(team => {
      if (countryFilter !== 'all' && team.name !== countryFilter) return false;
      if (groupFilter !== 'all' && team.group !== groupFilter) return false;
      if (statusFilter !== 'all' && team.status !== statusFilter) return false;
      if (!searchQuery) return true;

      const haystack = [
        team.name,
        team.code,
        team.group,
        team.status,
        ...(team.notableAbsences || []).flatMap(absence => [
          absence.player,
          absence.reason,
        ]),
        ...(team.players || []).flatMap(player => [
          player.displayName,
          player.listingName,
          player.position,
          player.positionCode,
        ]),
        ...(team.selectionNotes || []),
        ...(team.knownChanges || []).flatMap(change => [
          change.playerOut,
          change.playerIn,
          change.reason,
        ]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchQuery);
    });
  }, [countryFilter, groupFilter, searchQuery, statusFilter, teams]);

  const statusCounts = useMemo(() => ({
    updated: teams.filter(team => team.status === 'updated-before-opener').length,
    watch: teams.filter(team => team.status === 'selection-watch').length,
    clear: teams.filter(team => team.status === 'clear-no-change-located').length,
  }), [teams]);

  const playerTotal = useMemo(
    () => teams.reduce((sum, team) => sum + (team.playerCount || 0), 0),
    [teams]
  );

  const filtersActive = countryFilter !== 'all' || groupFilter !== 'all' || statusFilter !== 'all' || search.trim();

  const resetFilters = () => {
    setSearch('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const lastVerified = useMemo(
    () => [availabilityData?.lastVerified, squadsData?.lastVerified]
      .filter(Boolean)
      .sort()
      .at(-1),
    [availabilityData, squadsData]
  );
  const statusText = dataState.loading
    ? 'Loading squad data...'
    : lastVerified
      ? `Verified ${formatDate(lastVerified)}`
      : 'Data unavailable';

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">All 48 Teams</h2>
        <span className="dash-last-updated">{statusText}</span>
      </div>

      <p className="dash-sub-desc" style={{ marginBottom: 24 }}>
        Tournament-wide squad and availability view. Search every team or player, filter by group or
        status, and surface sourced notable absences when a well-known player missed the final 26.
      </p>

      {dataState.error && (
        <div className="api-error-bar">
          {teams.length ? 'Reload failed - showing last loaded team data.' : 'Team data unavailable.'}
          <button className="api-retry-btn" onClick={() => setReloadSeed(value => value + 1)}>Retry</button>
        </div>
      )}

      {!teams.length && dataState.loading ? (
        <div className="dash-section-loading" role="status" aria-label="Loading team squads">
          Loading squad and availability data...
        </div>
      ) : (
        <>
          <div className="wc-overview-grid">
            <div className="card wc-overview-card">
              <span className="wc-overview-card__label">Teams</span>
              <strong className="wc-overview-card__value">{teams.length}</strong>
              <span className="wc-overview-card__sub">All 12 groups</span>
            </div>
            <div className="card wc-overview-card">
              <span className="wc-overview-card__label">Players</span>
              <strong className="wc-overview-card__value">{playerTotal}</strong>
              <span className="wc-overview-card__sub">Official FIFA squad list</span>
            </div>
            <div className="card wc-overview-card">
              <span className="wc-overview-card__label">Updated</span>
              <strong className="wc-overview-card__value">{statusCounts.updated}</strong>
              <span className="wc-overview-card__sub">Pre-opener changes</span>
            </div>
            <div className="card wc-overview-card">
              <span className="wc-overview-card__label">Watch</span>
              <strong className="wc-overview-card__value">{statusCounts.watch}</strong>
              <span className="wc-overview-card__sub">Selection caution</span>
            </div>
            <div className="card wc-overview-card">
              <span className="wc-overview-card__label">Clear</span>
              <strong className="wc-overview-card__value">{statusCounts.clear}</strong>
              <span className="wc-overview-card__sub">No change located</span>
            </div>
          </div>

          <div className="match-search-wrap">
            <input
              className="match-search"
              type="search"
              placeholder="Search by country, player, position, code, or note..."
              value={search}
              onChange={event => setSearch(event.target.value)}
              aria-label="Search all teams"
            />
          </div>

          <div className="filter-bar">
            <select
              className="filter-select"
              value={countryFilter}
              onChange={event => updateParams({ country: event.target.value })}
            >
              <option value="all">All countries</option>
              {allCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={groupFilter}
              onChange={event => updateParams({ group: event.target.value })}
            >
              <option value="all">All groups</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>Group {group.id}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={statusFilter}
              onChange={event => updateParams({ status: event.target.value })}
            >
              <option value="all">All statuses</option>
              <option value="updated-before-opener">Updated before opener</option>
              <option value="selection-watch">Selection watch</option>
              <option value="clear-no-change-located">No change located</option>
            </select>

            {filtersActive && (
              <button className="filter-clear" onClick={resetFilters} aria-label="Reset team filters">
                Reset
              </button>
            )}
          </div>

          <p className="wc-inline-note">
            Showing {filtered.length} of {teams.length} teams. Filters persist in the URL for refresh and sharing.
          </p>

          {filtered.length === 0 ? (
            <div className="empty-state">
              No teams match the current filters.{' '}
              <button className="api-retry-btn" onClick={resetFilters}>Clear filters</button>
            </div>
          ) : (
            <div className="wc-teams-grid">
              {filtered.map(team => (
                <TeamCard
                  key={team.code}
                  team={team}
                  expandSquad={Boolean(searchQuery) && filtered.length === 1}
                />
              ))}
            </div>
          )}
        </>
      )}

      <p className="dash-disclaimer">
        Player lists and positions come from FIFA&apos;s published World Cup squad list. Availability notes are
        cautionary and should be verified against the latest federation announcement or FIFA match-centre team
        sheet before publishing a player as active.
      </p>
    </div>
  );
}
