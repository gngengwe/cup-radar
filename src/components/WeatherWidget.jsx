import { useWeather } from '../hooks/useWeather';

function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T12:00:00');
  return Math.ceil((target - Date.now()) / 86_400_000);
}

export default function WeatherWidget({ matchDate }) {
  const { weather, status } = useWeather(matchDate);
  const days = daysUntil(matchDate);

  if (status === 'past') return null;

  if (status === 'tooFar' || status === 'noKey') {
    return (
      <div className="weather-widget weather-widget--placeholder">
        <span className="weather-widget__icon">🌤️</span>
        <span className="weather-widget__msg">
          {status === 'noKey'
            ? 'Add VITE_WEATHER_API_KEY for forecasts'
            : `Forecast available ~${Math.max(0, days - 5)} days before match`}
        </span>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="weather-widget weather-widget--loading">
        <span className="loading-dot" /> Fetching forecast…
      </div>
    );
  }

  if (status === 'error' || !weather) {
    return (
      <div className="weather-widget weather-widget--placeholder">
        <span className="weather-widget__icon">🌡️</span>
        <span className="weather-widget__msg">Check weather.com for match-day forecast</span>
      </div>
    );
  }

  return (
    <div className="weather-widget">
      <span className="weather-widget__icon">{weather.icon}</span>
      <span className="weather-widget__temp">{weather.temp}°F</span>
      <span className="weather-widget__desc">{weather.iconLabel}</span>
      {weather.rainChance > 20 && (
        <span className="weather-widget__rain">💧 {weather.rainChance}% rain</span>
      )}
      <span className="weather-widget__wind">💨 {weather.wind} mph</span>
    </div>
  );
}
