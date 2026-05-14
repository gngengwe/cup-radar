// OpenWeatherMap 5-day forecast for Lumen Field (Seattle)
// Free tier: https://openweathermap.org/api — sign up for VITE_WEATHER_API_KEY
// Forecasts are only reliable within ~5 days. Shows a placeholder beyond that window.

import { useState, useEffect } from 'react';

const LAT  = 47.5951;
const LON  = -122.3316;
const FORECAST_WINDOW_DAYS = 5;
const FETCH_TIMEOUT_MS     = 8_000;

const WEATHER_ICONS = {
  Clear:        { emoji: '☀️',  label: 'Clear'         },
  Clouds:       { emoji: '⛅',  label: 'Partly cloudy' },
  Rain:         { emoji: '🌧️',  label: 'Rain'          },
  Drizzle:      { emoji: '🌦️',  label: 'Drizzle'       },
  Thunderstorm: { emoji: '⛈️',  label: 'Storms'        },
  Snow:         { emoji: '❄️',  label: 'Snow'          },
  Mist:         { emoji: '🌫️',  label: 'Mist'          },
  Fog:          { emoji: '🌫️',  label: 'Fog'           },
};

function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T12:00:00');
  return (target - Date.now()) / 86_400_000;
}

export function useWeather(matchDate) {
  const [weather,   setWeather]   = useState(null);
  const [status,    setStatus]    = useState('loading');

  useEffect(() => {
    if (!matchDate) return;

    const days   = daysUntil(matchDate);
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

    if (!apiKey) {
      setStatus('noKey');
      return;
    }

    if (days > FORECAST_WINDOW_DAYS) {
      setStatus('tooFar');
      return;
    }

    if (days < 0) {
      setStatus('past');
      return;
    }

    const cacheKey = `wx_${matchDate}`;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached && Date.now() < cached.expires) {
        setWeather(cached.data);
        setStatus('available');
        return;
      }
    } catch {}

    // AbortController for fetch timeout
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    // Use URLSearchParams to avoid leaking key in string interpolation logs
    const params = new URLSearchParams({ lat: LAT, lon: LON, appid: apiKey, units: 'imperial' });

    fetch(`https://api.openweathermap.org/data/2.5/forecast?${params}`, {
      signal: controller.signal,
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (!data.list || !Array.isArray(data.list)) throw new Error('Invalid response');

        // Find forecast entry closest to match kickoff (7 PM PT = 02:00 UTC next day)
        const matchTs = new Date(matchDate + 'T02:00:00Z').getTime() / 1000;
        const closest = data.list.reduce((prev, curr) =>
          Math.abs(curr.dt - matchTs) < Math.abs(prev.dt - matchTs) ? curr : prev
        );

        if (!closest?.main) throw new Error('Missing forecast data');

        const iconKey = closest.weather?.[0]?.main || 'Clear';
        const icon    = WEATHER_ICONS[iconKey] || { emoji: '🌡️', label: iconKey };

        const result = {
          temp:        Math.round(closest.main.temp),
          feelsLike:   Math.round(closest.main.feels_like ?? closest.main.temp),
          description: closest.weather?.[0]?.description || '',
          icon:        icon.emoji,
          iconLabel:   icon.label,
          rainChance:  Math.round((closest.pop || 0) * 100),
          wind:        Math.round(closest.wind?.speed || 0),
          humidity:    closest.main.humidity ?? 0,
        };

        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: result,
            expires: Date.now() + 60 * 60 * 1000,
          }));
        } catch {}

        setWeather(result);
        setStatus('available');
      })
      .catch(err => {
        if (err.name !== 'AbortError') setStatus('error');
        // AbortError = timeout — silently fall through to placeholder
      })
      .finally(() => clearTimeout(timer));

    return () => { controller.abort(); clearTimeout(timer); };
  }, [matchDate]);

  return { weather, status };
}
