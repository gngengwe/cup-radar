// ─── football-data.org API service ────────────────────────────────────────────
// Free tier: 10 calls/minute. API key goes in VITE_FOOTBALL_API_KEY env var.
// Docs: https://www.football-data.org/documentation/quickstart
// WC 2026 competition ID: 2000 (FIFA World Cup)

const BASE_URL  = 'https://api.football-data.org/v4';
const COMP_ID   = 2000;   // FIFA World Cup (all editions)
const WC_SEASON = 2026;

// ─── Flag map (TLA → emoji) ────────────────────────────────────────────────────
const FLAGS = {
  MEX:'🇲🇽', RSA:'🇿🇦', USA:'🇺🇸', CAN:'🇨🇦', BRA:'🇧🇷', ARG:'🇦🇷', FRA:'🇫🇷',
  ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', ESP:'🇪🇸', GER:'🇩🇪', POR:'🇵🇹', NED:'🇳🇱', BEL:'🇧🇪', CRO:'🇭🇷',
  URU:'🇺🇾', COL:'🇨🇴', CHI:'🇨🇱', ECU:'🇪🇨', PER:'🇵🇪', BOL:'🇧🇴', PAR:'🇵🇾',
  VEN:'🇻🇪', HON:'🇭🇳', PAN:'🇵🇦', JAM:'🇯🇲', CRI:'🇨🇷', MAR:'🇲🇦', SEN:'🇸🇳',
  NGA:'🇳🇬', EGY:'🇪🇬', TUN:'🇹🇳', CMR:'🇨🇲', ZAF:'🇿🇦', GHA:'🇬🇭', CIV:'🇨🇮',
  JPN:'🇯🇵', KOR:'🇰🇷', AUS:'🇦🇺', IRN:'🇮🇷', KSA:'🇸🇦', IRQ:'🇮🇶', JOR:'🇯🇴',
  IDN:'🇮🇩', NZL:'🇳🇿', SCO:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', WAL:'🏴󠁧󠁢󠁷󠁬󠁳󠁿', SRB:'🇷🇸', POL:'🇵🇱', UKR:'🇺🇦',
  HUN:'🇭🇺', ROU:'🇷🇴', TUR:'🇹🇷', AUT:'🇦🇹', SVK:'🇸🇰', CZE:'🇨🇿', GEO:'🇬🇪',
};

function getFlag(tla) {
  return FLAGS[tla] || '🏳️';
}

// ─── Status normaliser ─────────────────────────────────────────────────────────
function normaliseStatus(apiStatus) {
  const map = {
    SCHEDULED: 'scheduled',
    TIMED:     'scheduled',
    IN_PLAY:   'live',
    PAUSED:    'live',
    FINISHED:  'finished',
    SUSPENDED: 'postponed',
    POSTPONED: 'postponed',
    CANCELLED: 'postponed',
  };
  return map[apiStatus] || 'scheduled';
}

// ─── Match transformer ─────────────────────────────────────────────────────────
function transformMatch(m) {
  const utcDate = new Date(m.utcDate);
  const dateStr = utcDate.toISOString().split('T')[0];

  const stage = (m.stage || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const group = m.group ? m.group.replace('GROUP_', '') : null;

  const venue      = m.venue || '';
  const venueLower = venue.toLowerCase();
  const isSeattle  = venueLower.includes('lumen')   || venueLower.includes('seattle');
  const isKC       = venueLower.includes('arrowhead') || venueLower.includes('kansas city');
  const isMiami    = venueLower.includes('hard rock') || venueLower.includes('miami gardens');
  const isNY       = venueLower.includes('metlife')  || venueLower.includes('east rutherford');
  const isPhilly   = venueLower.includes('lincoln financial') || venueLower.includes('philadelphia');
  const isAtlanta  = venueLower.includes('mercedes-benz') || venueLower.includes('atlanta');
  const isVancouver = venueLower.includes('bc place') || venueLower.includes('vancouver');

  const cityInfo = isSeattle ? { city: 'Seattle',       cityCode: 'SEA', tz: 'PT' }
                : isKC       ? { city: 'Kansas City',   cityCode: 'KC',  tz: 'CT' }
                : isMiami    ? { city: 'Miami',         cityCode: 'MIA', tz: 'ET' }
                : isNY       ? { city: 'New York',      cityCode: 'NY',  tz: 'ET' }
                : isPhilly   ? { city: 'Philadelphia',  cityCode: 'PHI', tz: 'ET' }
                : isAtlanta  ? { city: 'Atlanta',       cityCode: 'ATL', tz: 'ET' }
                : isVancouver ? { city: 'Vancouver',    cityCode: 'VAN', tz: 'PT' }
                :              { city: m.venue?.split(',')[1]?.trim() || '', cityCode: '', tz: 'ET' };

  const TZ_MAP = { PT: 'America/Los_Angeles', CT: 'America/Chicago', ET: 'America/New_York' };
  const localTime = utcDate.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: TZ_MAP[cityInfo.tz] || 'America/Los_Angeles',
  });

  return {
    id:         `api-${m.id}`,
    apiId:      m.id,
    date:       dateStr,
    time:       localTime,
    timezone:   cityInfo.tz,
    homeTeam:   m.homeTeam?.name   || 'TBD',
    homeCode:   m.homeTeam?.tla    || 'TBD',
    homeFlag:   getFlag(m.homeTeam?.tla),
    awayTeam:   m.awayTeam?.name   || 'TBD',
    awayCode:   m.awayTeam?.tla    || 'TBD',
    awayFlag:   getFlag(m.awayTeam?.tla),
    venue,
    city:        cityInfo.city,
    cityCode:    cityInfo.cityCode,
    group,
    stage,
    matchday:   m.matchday || null,
    status:     normaliseStatus(m.status),
    homeScore:  m.score?.fullTime?.home ?? null,
    awayScore:  m.score?.fullTime?.away ?? null,
    seattleMatch: isSeattle,
    kcMatch:      isKC,
    miamiMatch:   isMiami,
    nyMatch:      isNY,
    phillyMatch:  isPhilly,
    atlantaMatch: isAtlanta,
    vancouverMatch: isVancouver,
    notes:      '',
  };
}

// ─── Standings transformer ─────────────────────────────────────────────────────
function transformStandings(apiStandings) {
  return apiStandings
    .filter(s => s.type === 'TOTAL')
    .map(s => ({
      id:   s.group?.replace('GROUP_', '') || '?',
      name: `Group ${s.group?.replace('GROUP_', '') || '?'}`,
      teams: s.table.map(row => ({
        code:    row.team.tla || 'TBD',
        name:    row.team.name,
        flag:    getFlag(row.team.tla),
        played:  row.playedGames,
        won:     row.won,
        drawn:   row.draw,
        lost:    row.lost,
        gf:      row.goalsFor,
        ga:      row.goalsAgainst,
        gd:      row.goalDifference,
        points:  row.points,
        status:  'none',
      })),
    }));
}

// ─── Cache helpers ─────────────────────────────────────────────────────────────
function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, expires } = JSON.parse(raw);
    if (Date.now() > expires) { localStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function cacheSet(key, data, ttlMs) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, expires: Date.now() + ttlMs }));
  } catch {}
}

// ─── Core fetch ───────────────────────────────────────────────────────────────
async function apiFetch(path, ttlMs = 5 * 60 * 1000) {
  const apiKey = import.meta.env.VITE_FOOTBALL_API_KEY;
  if (!apiKey) throw new Error('VITE_FOOTBALL_API_KEY not configured');

  const cacheKey = `fd_${path}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': apiKey },
  });

  if (res.status === 429) throw new Error('Rate limited — try again in 60s');
  if (!res.ok)           throw new Error(`API ${res.status}: ${res.statusText}`);

  const data = await res.json();
  cacheSet(cacheKey, data, ttlMs);
  return data;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchAllMatches() {
  const data = await apiFetch(
    `/competitions/${COMP_ID}/matches?season=${WC_SEASON}`,
    5 * 60 * 1000   // 5-min cache when not live
  );
  return (data.matches || []).map(transformMatch);
}

export async function fetchTodayMatches() {
  const today = new Date().toISOString().split('T')[0];
  const data  = await apiFetch(
    `/competitions/${COMP_ID}/matches?dateFrom=${today}&dateTo=${today}&season=${WC_SEASON}`,
    60 * 1000       // 1-min cache for today
  );
  return (data.matches || []).map(transformMatch);
}

export async function fetchStandings() {
  const data = await apiFetch(
    `/competitions/${COMP_ID}/standings?season=${WC_SEASON}`,
    5 * 60 * 1000
  );
  return transformStandings(data.standings || []);
}

// ─── Live-match TTL shortener ─────────────────────────────────────────────────
// Call this when you detect a match is live — drops cache TTL to 30s
export function invalidateLiveCache() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('fd_'));
  keys.forEach(k => localStorage.removeItem(k));
}
