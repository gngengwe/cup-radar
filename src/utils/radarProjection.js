// Projects venue lat/lon onto a 0–100% square for the Goal Radar map,
// centering the 16-venue bounding box and keeping every point within
// `spreadPct` of center so blips never clip outside the radar circle.
export function computeBounds(coordsObj) {
  const lats = Object.values(coordsObj).map(v => v.lat);
  const lons = Object.values(coordsObj).map(v => v.lon);
  return {
    latMin: Math.min(...lats), latMax: Math.max(...lats),
    lonMin: Math.min(...lons), lonMax: Math.max(...lons),
  };
}

export function projectToRadar(lat, lon, bounds, spreadPct = 38) {
  const latMid = (bounds.latMin + bounds.latMax) / 2;
  const lonMid = (bounds.lonMin + bounds.lonMax) / 2;
  const latHalf = (bounds.latMax - bounds.latMin) / 2 || 1;
  const lonHalf = (bounds.lonMax - bounds.lonMin) / 2 || 1;
  const nx = (lon - lonMid) / lonHalf;
  const ny = (lat - latMid) / latHalf;
  return { x: 50 + nx * spreadPct, y: 50 - ny * spreadPct };
}
