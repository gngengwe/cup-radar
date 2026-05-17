import { useWeather } from '../hooks/useWeather';

function daysUntil(dateStr) {
  const target = new Date(dateStr + 'T12:00:00');
  return Math.ceil((target - Date.now()) / 86_400_000);
}

export default function WeatherWidget({ matchDate, cityId = 'seattle' }) {
  const { weather, status } = useWeather(matchDate, cityId);
  const days = daysUntil(matchDate);

  if (status === 'past') return null;

  if (status === 'tooFar' || status === 'noKey') {
    return (
      <div className="weather-widget weather-widget--placeholder">
        <span className="weather-widget__icon">🌤️</span>
        <span className="weather-widget__msg">
          {status === 'noKey'
            ? 'Weather forecast not available'
            : `Forecast available closer to match day`}
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
        <span className="weather-widget__msg">
          Weather forecast unavailable — check{' '}
          <a href="https://weather.com" target="_blank" rel="noopener noreferrer">weather.com</a>
        </span>
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
