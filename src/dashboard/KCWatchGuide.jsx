// Kansas City Watch Guide — uses kansascity.json preGame and fanZones data
import kcData from '../data/kansascity.json';

export default function KCWatchGuide() {
  const { preGame, fanZones, transit, lastUpdated } = kcData;

  const updatedStr = new Date(lastUpdated).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">Watch Guide</h2>
        <span className="dash-last-updated">Updated {updatedStr}</span>
      </div>

      <p className="dash-sub-desc" style={{ marginBottom: 20 }}>
        Where to watch, eat, and gather in Kansas City on match days — by neighborhood,
        distance to Kansas City Stadium, and vibe.
      </p>

      {/* ── Transit reminder ── */}
      <div className="hood-transit-banner" style={{ marginBottom: 28 }}>
        <div className="hood-transit-banner__icon">🚌</div>
        <div>
          <strong>{transit.recommended}</strong>
          <br />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            KC is more car-friendly than Seattle. Official shuttles from Power &amp; Light and Crown Center
            are the best option on match days.
          </span>
        </div>
      </div>

      {/* ── Pre-game spots ── */}
      <div className="dash-sub-section">
        <h3 className="dash-sub-heading">Pre-Game Spots</h3>
        <p className="dash-sub-desc">Kansas City's best pre-game areas near Kansas City Stadium.</p>
        <div className="pregame-list">
          {preGame.map((spot, i) => (
            <div key={i} className="pregame-card">
              <div className="pregame-card__name">{spot.name}</div>
              <div className="pregame-card__type">{spot.type} · {spot.area}</div>
              <div className="pregame-card__distance">🚌 {spot.distance}</div>
              <div className="pregame-card__notes">{spot.notes}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fan zones ── */}
      <div className="dash-sub-section">
        <h3 className="dash-sub-heading">Fan Zones & Watch Parties</h3>
        <div className="events-list">
          {fanZones.map((zone, i) => (
            <div key={i} className="event-card">
              <div className="event-card__top">
                <span className="event-card__type">Fan Zone</span>
                {!zone.confirmed && <span className="event-card__unconfirmed">TBC</span>}
                {zone.free && <span className="event-card__free">Free</span>}
              </div>
              <div className="event-card__name">{zone.name}</div>
              <div className="event-card__location">📍 {zone.location}</div>
              <div className="event-card__dates">📅 {zone.dates} · {zone.hours}</div>
              {zone.notes && <div className="event-card__notes">{zone.notes}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Transit tips ── */}
      <div className="dash-sub-section">
        <h3 className="dash-sub-heading">Getting to Kansas City Stadium</h3>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-card__icon">🚌</div>
            <div className="info-card__title">Recommended</div>
            <div className="info-card__body">
              <strong>{transit.recommended}</strong>
              <ul className="info-list">
                {transit.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          </div>
          <div className="info-card">
            <div className="info-card__icon">🅿️</div>
            <div className="info-card__title">Parking & Rideshare</div>
            <div className="info-card__body">
              <strong>Parking:</strong> {kcData.venue.parkingNote}<br /><br />
              <strong>Rideshare:</strong> {transit.rideshare}
            </div>
          </div>
        </div>
      </div>

      <p className="dash-disclaimer">
        Venue hours, event schedules, and transit routes are subject to change.
        Confirm details at kansascityfwc26.com. Cup Radar is not affiliated with FIFA.
      </p>
    </div>
  );
}
