// OpenWeatherMap One Call API 3.0 — hourly forecast for match venue
// Docs: https://openweathermap.org/api/one-call-3
// Key goes in VITE_WEATHER_API_KEY (GitHub secret → auto-deployed)
// First 1,000 calls/day free. Cup Radar uses <50 calls/day in practice.

import { useState, useEffect } from 'react';

// Venue coordinates — One Call API returns the closest forecast point.
// Keyed by normalized host-city name so any of the 16 World Cup 2026
// venues can resolve a forecast, not just the sponsor cities.
const VENUES = {
  seattle:          { lat: 47.5952,  lon: -122.3316 }, // Lumen Field
  kansascity:       { lat: 39.0489,  lon: -94.4839  }, // Kansas City Stadium (Arrowhead)
  miami:            { lat: 25.9580,  lon: -80.2389  }, // Hard Rock Stadium
  newyork:          { lat: 40.8135,  lon: -74.0744  }, // MetLife Stadium
  philadelphia:     { lat: 39.9008,  lon: -75.1675  }, // Lincoln Financial Field
  atlanta:          { lat: 33.7553,  lon: -84.4006  }, // Mercedes-Benz Stadium
  vancouver:        { lat: 49.2768,  lon: -123.1119 }, // BC Place
  losangeles:       { lat: 33.9535,  lon: -118.3392 }, // SoFi Stadium
  mexicocity:       { lat: 19.3029,  lon: -99.1505  }, // Estadio Azteca
  dallas:           { lat: 32.7473,  lon: -97.0945  }, // AT&T Stadium
  guadalajara:      { lat: 20.6792,  lon: -103.4649 }, // Estadio Akron
  boston:           { lat: 42.0909,  lon: -71.2643  }, // Gillette Stadium
  houston:          { lat: 29.6847,  lon: -95.4107  }, // NRG Stadium
  monterrey:        { lat: 25.6694,  lon: -100.2458 }, // Estadio BBVA
  toronto:          { lat: 43.6332,  lon: -79.4185  }, // BMO Field
  sanfranciscobay:  { lat: 37.4030,  lon: -121.9700 }, // Levi's Stadium
};

function normalizeCity(city) {
  return (city || '').toLowerCase().replace(/[^a-z]/g, '');
}

const FORECAST_WINDOW_DAYS = 2; // One Call API 3.0 hourly = 48hrs; daily = 8 days
const FETCH_TIMEOUT_MS     = 8_000;

const WEATHER_ICONS = {
  Clear:        { emoji: '☀️',  label: 'Clear'         },
  Clouds:       { emoji: '⛅',  label: 'Partly cloudy' },
  Rain:         { emoji: '🌧️',  label: 'Rain'          },
  Drizzle:      { emoji: '🌦️',  label: 'Drizzle'       },
  Thunderstorm: { emoji: '⛈️',  label: 'Storms'        },
  Snow:         { emoji: '❄️',  label: 'Snow'          },
  Mist:         { emoji: '🌫️',  label: 'Mist/Fog'     },
  Fog:          { emoji: '🌫️',  label: 'Foggy'         },
};

function daysUntil(dateStr) {
  return (new Date(dateStr + 'T12:00:00') - Date.now()) / 86_400_000;
}

export function useWeather(matchDate, city = 'Seattle') {
  const [weather, setWeather] = useState(null);
  const [status,  setStatus]  = useState('loading');
  const venueKey = normalizeCity(city);

  useEffect(() => {
    if (!matchDate) return;

    const days   = daysUntil(matchDate);
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

    if (!apiKey)              { setStatus('noKey');  return; }
    if (!VENUES[venueKey])    { setStatus('noVenue'); return; }
    if (days > FORECAST_WINDOW_DAYS) { setStatus('tooFar'); return; }
    if (days < 0)             { setStatus('past');   return; }

    const cacheKey = `wx3_${venueKey}_${matchDate}`;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached && Date.now() < cached.expires) {
        setWeather(cached.data);
        setStatus('available');
        return;
      }
    } catch {}

    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const { lat, lon } = VENUES[venueKey];

    // One Call API 3.0 — returns hourly (48h) and daily (8d) in one call
    const params = new URLSearchParams({
      lat, lon,
      appid:   apiKey,
      units:   'imperial',
      exclude: 'minutely,alerts', // save response bytes
    });

    fetch(`https://api.openweathermap.org/data/3.0/onecall?${params}`, {
      signal: controller.signal,
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        // Target: match kickoff converted to UTC unix timestamp
        // Most Seattle PT matches kick off 7–8 PM PT = 02:00–03:00 UTC next day
        const matchTs = new Date(matchDate + 'T02:00:00Z').getTime() / 1000;

        // Prefer hourly (within 48h) → fall back to daily
        const source = data.hourly?.length ? data.hourly : data.daily || [];
        if (!source.length) throw new Error('No forecast data');

        const closest = source.reduce((prev, curr) =>
          Math.abs(curr.dt - matchTs) < Math.abs(prev.dt - matchTs) ? curr : prev
        );

        // One Call 3.0 flattens temp to top level in hourly; daily has temp.day
        const temp      = closest.temp?.day ?? closest.temp ?? 0;
        const feelsLike = closest.feels_like?.day ?? closest.feels_like ?? temp;
        const iconKey   = closest.weather?.[0]?.main || 'Clear';
        const icon      = WEATHER_ICONS[iconKey] || { emoji: '🌡️', label: iconKey };

        const result = {
          temp:        Math.round(temp),
          feelsLike:   Math.round(feelsLike),
          description: closest.weather?.[0]?.description || '',
          icon:        icon.emoji,
          iconLabel:   icon.label,
          rainChance:  Math.round((closest.pop || 0) * 100),
          wind:        Math.round(closest.wind_speed || 0),
          humidity:    closest.humidity ?? 0,
        };

        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data:    result,
            expires: Date.now() + 60 * 60 * 1000, // 1-hr cache
          }));
        } catch {}

        setWeather(result);
        setStatus('available');
      })
      .catch(err => {
        if (err.name !== 'AbortError') setStatus('error');
      })
      .finally(() => clearTimeout(timer));

    return () => { controller.abort(); clearTimeout(timer); };
  }, [matchDate, venueKey]);

  return { weather, status };
}
