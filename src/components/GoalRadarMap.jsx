// Goal Radar — a sonar-style map of the 16 World Cup 2026 host cities.
// Each city blips like a radar contact, sized by goals scored there;
// `activeCity` (a normalized city key) glows brightest, in sync with
// whatever goal is currently "playing" in the montage feed above/below it.
import { VENUE_COORDS } from '../data/venueCoords';
import { computeBounds, projectToRadar } from '../utils/radarProjection';

const BOUNDS = computeBounds(VENUE_COORDS);

// Stylized North America coastline (Vancouver → Mexico → Gulf → Florida →
// Atlantic seaboard → back across the interior to Vancouver), hand-plotted
// from real coastal lat/lon through the same projectToRadar() the blips use,
// so the silhouette and the city dots always line up.
const WORLD_MAP_PATH =
  'M25.2,7.6 L12.0,12.0 L13.1,16.3 L11.0,19.8 L13.0,41.2 L19.0,50.9 L20.7,54.0 ' +
  'L21.5,56.2 L31.4,78.9 L38.2,84.6 L46.0,94.2 L53.9,96.4 L65.2,83.3 L49.0,80.7 ' +
  'L53.5,62.7 L60.4,61.0 L64.6,59.9 L71.6,66.1 L72.6,74.7 L74.9,71.6 L73.6,55.6 ' +
  'L75.3,53.8 L80.6,43.5 L84.0,33.7 L88.3,29.5 L89.5,26.2 L95.7,22.8 L88.1,18.3 ' +
  'L68.6,21.6 L50.1,10.4 Z';

export default function GoalRadarMap({ cityCounts = {}, activeCity = null, onBlipClick = null }) {
  const maxCount = Math.max(1, ...Object.values(cityCounts));
  const activeVenue = activeCity ? VENUE_COORDS[activeCity] : null;
  const ballPos = activeVenue ? projectToRadar(activeVenue.lat, activeVenue.lon, BOUNDS) : { x: 50, y: 50 };

  return (
    <div className="goal-radar" role="img" aria-label="Map of World Cup 2026 host cities, sized by goals scored">
      <svg className="goal-radar__worldmap" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d={WORLD_MAP_PATH} />
      </svg>
      <div className="goal-radar__rings">
        <span className="goal-radar__ring" />
        <span className="goal-radar__ring" />
        <span className="goal-radar__ring" />
        <span className="goal-radar__crosshair goal-radar__crosshair--h" />
        <span className="goal-radar__crosshair goal-radar__crosshair--v" />
      </div>
      <div className="goal-radar__sweep" />

      <span
        className={`goal-radar__ball${activeVenue ? ' goal-radar__ball--active' : ''}`}
        style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%` }}
        aria-hidden="true"
      >
        <span className="goal-radar__ball-spin">⚽</span>
      </span>

      {Object.entries(VENUE_COORDS).map(([key, venue]) => {
        const count  = cityCounts[key] || 0;
        const { x, y } = projectToRadar(venue.lat, venue.lon, BOUNDS);
        const scale  = 0.6 + 0.5 * (count / maxCount);
        const active = key === activeCity;

        return (
          <button
            key={key}
            type="button"
            className={`goal-radar__blip${count ? '' : ' goal-radar__blip--quiet'}${active ? ' goal-radar__blip--active' : ''}`}
            style={{ left: `${x}%`, top: `${y}%`, '--blip-scale': scale }}
            onClick={onBlipClick ? () => onBlipClick(key) : undefined}
            tabIndex={onBlipClick ? 0 : -1}
            aria-label={`${venue.label}: ${count} goal${count === 1 ? '' : 's'}`}
          >
            <span className="goal-radar__blip-dot" />
            <span className="goal-radar__blip-label">
              {venue.label}{count > 0 && <strong> · {count}</strong>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
