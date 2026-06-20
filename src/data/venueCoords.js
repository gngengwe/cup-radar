// Shared host-city coordinates — used by the weather forecast feature and
// the Goal Radar map. Keyed by normalized city name so any of the 16
// World Cup 2026 venues resolves consistently across features.
export const VENUE_COORDS = {
  seattle:          { lat: 47.5952,  lon: -122.3316, label: 'Seattle' },
  kansascity:       { lat: 39.0489,  lon: -94.4839,  label: 'Kansas City' },
  miami:            { lat: 25.9580,  lon: -80.2389,  label: 'Miami' },
  newyork:          { lat: 40.8135,  lon: -74.0744,  label: 'New York' },
  philadelphia:     { lat: 39.9008,  lon: -75.1675,  label: 'Philadelphia' },
  atlanta:          { lat: 33.7553,  lon: -84.4006,  label: 'Atlanta' },
  vancouver:        { lat: 49.2768,  lon: -123.1119, label: 'Vancouver' },
  losangeles:       { lat: 33.9535,  lon: -118.3392, label: 'Los Angeles' },
  mexicocity:       { lat: 19.3029,  lon: -99.1505,  label: 'Mexico City' },
  dallas:           { lat: 32.7473,  lon: -97.0945,  label: 'Dallas' },
  guadalajara:      { lat: 20.6792,  lon: -103.4649, label: 'Guadalajara' },
  boston:           { lat: 42.0909,  lon: -71.2643,  label: 'Boston' },
  houston:          { lat: 29.6847,  lon: -95.4107,  label: 'Houston' },
  monterrey:        { lat: 25.6694,  lon: -100.2458, label: 'Monterrey' },
  toronto:          { lat: 43.6332,  lon: -79.4185,  label: 'Toronto' },
  sanfranciscobay:  { lat: 37.4030,  lon: -121.9700, label: 'San Francisco Bay' },
};

export function normalizeCity(city) {
  return (city || '').toLowerCase().replace(/[^a-z]/g, '');
}
