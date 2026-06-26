// Remembers the most recently viewed city dashboard so global nav entry
// points (e.g. the landing page drawer) know where to send "Bracket",
// "Match Tracker", etc. before a city has been chosen this session.
const KEY = 'cupradar_last_city';
const DEFAULT_CITY = 'seattle';
const VALID_CITIES = [
  'seattle', 'kansascity', 'miami', 'newyork', 'philly',
  'atlanta', 'vancouver', 'losangeles',
];

export function getLastCity() {
  try {
    const v = localStorage.getItem(KEY);
    return VALID_CITIES.includes(v) ? v : DEFAULT_CITY;
  } catch {
    return DEFAULT_CITY;
  }
}

export function setLastCity(city) {
  if (!VALID_CITIES.includes(city)) return;
  try { localStorage.setItem(KEY, city); } catch { /* storage unavailable */ }
}
