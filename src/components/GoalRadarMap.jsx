// Goal Radar — a sonar-style map of the 16 World Cup 2026 host cities.
// Each city blips like a radar contact, sized by goals scored there;
// `activeCity` (a normalized city key) glows brightest, in sync with
// whatever goal is currently "playing" in the montage feed above/below it.
import { VENUE_COORDS } from '../data/venueCoords';
import { computeBounds, projectToRadar } from '../utils/radarProjection';

const BOUNDS = computeBounds(VENUE_COORDS);

export default function GoalRadarMap({ cityCounts = {}, activeCity = null, onBlipClick = null }) {
  const maxCount = Math.max(1, ...Object.values(cityCounts));

  return (
    <div className="goal-radar" role="img" aria-label="Map of World Cup 2026 host cities, sized by goals scored">
      <div className="goal-radar__rings">
        <span className="goal-radar__ring" />
        <span className="goal-radar__ring" />
        <span className="goal-radar__ring" />
        <span className="goal-radar__crosshair goal-radar__crosshair--h" />
        <span className="goal-radar__crosshair goal-radar__crosshair--v" />
      </div>
      <div className="goal-radar__sweep" />

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
