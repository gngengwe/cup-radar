export const CITY_META = {
  seattle:    { label: 'Seattle',      short: 'SEA', icon: '🏟️', matchFlag: 'seattleMatch', newsCategory: 'seattle',    accentColor: 'var(--accent)' },
  kansascity: { label: 'Kansas City',  short: 'KC',  icon: '🏈', matchFlag: 'kcMatch',       newsCategory: 'kansascity', accentColor: '#c084fc' },
  miami:      { label: 'Miami',        short: 'MIA', icon: '🌴', matchFlag: 'miamiMatch',    newsCategory: 'miami',      accentColor: '#f43f5e' },
  newyork:    { label: 'New York',     short: 'NY',  icon: '🗽', matchFlag: 'nyMatch',       newsCategory: 'newyork',    accentColor: '#3b82f6' },
  philly:     { label: 'Philadelphia', short: 'PHI', icon: '🦅', matchFlag: 'phillyMatch',   newsCategory: 'philly',     accentColor: '#10b981' },
};

export function getCityMeta(city) {
  return CITY_META[city] || CITY_META.seattle;
}

export function isHomeMatch(match, city) {
  return !!match[getCityMeta(city).matchFlag];
}

// All city-specific news categories — used to exclude other cities from "all" view
export const CITY_NEWS_CATS = new Set(Object.values(CITY_META).map(m => m.newsCategory));
