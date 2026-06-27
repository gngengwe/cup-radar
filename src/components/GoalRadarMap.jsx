import { VENUE_COORDS } from '../data/venueCoords';
import { projectToRadar } from '../utils/radarProjection';
import { GOAL_RADAR_BOUNDS, GOAL_RADAR_WORLD_MAP_PATH } from '../utils/goalRadarVisuals';

function buildTrailPath(start, end) {
  if (!start || !end) return null;
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  if (distance < 1) return null;

  const midX = (start.x + end.x) / 2;
  const midY = Math.max(0, Math.min(start.y, end.y) - Math.min(18, 8 + distance * 0.18));
  return `M${start.x},${start.y} Q${midX},${midY} ${end.x},${end.y}`;
}

export default function GoalRadarMap({
  cityCounts = {},
  activeCity = null,
  previousCity = null,
  burstKey = 0,
  onBlipClick = null,
  reducedMotion = false,
}) {
  const maxCount = Math.max(1, ...Object.values(cityCounts));
  const activeVenue = activeCity ? VENUE_COORDS[activeCity] : null;
  const previousVenue = previousCity ? VENUE_COORDS[previousCity] : null;
  const ballPos = activeVenue ? projectToRadar(activeVenue.lat, activeVenue.lon, GOAL_RADAR_BOUNDS) : { x: 50, y: 50 };
  const previousPos = previousVenue ? projectToRadar(previousVenue.lat, previousVenue.lon, GOAL_RADAR_BOUNDS) : null;
  const trailPath = buildTrailPath(previousPos, ballPos);

  return (
    <div
      className={`goal-radar${activeVenue ? ' goal-radar--live' : ''}${reducedMotion ? ' goal-radar--reduced' : ''}`}
      role="img"
      aria-label="Map of World Cup 2026 host cities, sized by goals scored"
    >
      <svg className="goal-radar__worldmap" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d={GOAL_RADAR_WORLD_MAP_PATH} />
      </svg>

      <svg className="goal-radar__travel" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {!reducedMotion && trailPath ? [
          <path key={`trail-glow-${burstKey}`} className="goal-radar__trail goal-radar__trail--glow" d={trailPath} />,
          <path key={`trail-${burstKey}`} className="goal-radar__trail" d={trailPath} />,
        ] : null}
      </svg>

      <div className="goal-radar__rings">
        <span className="goal-radar__ring" />
        <span className="goal-radar__ring" />
        <span className="goal-radar__ring" />
        <span className="goal-radar__crosshair goal-radar__crosshair--h" />
        <span className="goal-radar__crosshair goal-radar__crosshair--v" />
      </div>
      {!reducedMotion && activeVenue ? [
        <span key={`flash-${burstKey}`} className="goal-radar__flash" />,
        <span key={`scan-${burstKey}`} className="goal-radar__impact-wash" />,
      ] : null}
      <div className="goal-radar__sweep" />

      <span
        className={`goal-radar__ball${activeVenue ? ' goal-radar__ball--active' : ''}`}
        style={{ left: `${ballPos.x}%`, top: `${ballPos.y}%` }}
        aria-hidden="true"
      >
        <span className="goal-radar__ball-trail" />
        <span className="goal-radar__ball-spin">⚽</span>
      </span>

      {Object.entries(VENUE_COORDS).map(([key, venue]) => {
        const count  = cityCounts[key] || 0;
        const { x, y } = projectToRadar(venue.lat, venue.lon, GOAL_RADAR_BOUNDS);
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
            {active && !reducedMotion ? [
              <span key={`impact-${burstKey}`} className="goal-radar__impact" />,
              <span key={`impact-late-${burstKey}`} className="goal-radar__impact goal-radar__impact--late" />,
              <span key={`flare-${burstKey}`} className="goal-radar__flare" />,
            ] : null}
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
