import { useParams } from 'react-router-dom';
import alertsData from '../data/alerts.json';
import { getCityMeta } from '../utils/cityConfig';

const ACTION_CONFIG = {
  move:  { label: 'MOVE',  bg: 'var(--accent)',           color: '#041208',          sub: 'Good window right now — act before prices climb.'  },
  watch: { label: 'WATCH', bg: 'var(--blue-soft)',         color: '#4d8eff',          sub: 'Monitor but don\'t chase yet.'                      },
  wait:  { label: 'WAIT',  bg: 'rgba(255,255,255,0.06)',   color: 'var(--text-muted)', sub: 'Overpriced — expect the floor to come down.'       },
};

export default function TicketPulse() {
  const { city = 'seattle' } = useParams();
  const cityMeta  = getCityMeta(city);
  const pulse     = alertsData.ticketPulse?.[city];
  const actionCfg = ACTION_CONFIG[pulse?.action] || ACTION_CONFIG.watch;

  const updatedStr = pulse?.updatedAt
    ? new Date(pulse.updatedAt + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div>
      <div className="dash-section-header">
        <h2 className="dash-section-title">Ticket Pulse · {cityMeta.label}</h2>
        {updatedStr && <span className="dash-last-updated">Updated {updatedStr}</span>}
      </div>

      <p className="dash-sub-desc" style={{ marginBottom: 24 }}>
        A weekly read on the {cityMeta.label} ticket market — not a seller, just a signal.
      </p>

      {pulse ? (
        <>
          <div className="ticket-pulse-card">
            <div className="ticket-pulse-card__action-row">
              <span className="ticket-pulse-action" style={{ background: actionCfg.bg, color: actionCfg.color }}>
                {actionCfg.label}
              </span>
              <span className="ticket-pulse-action__sub">{actionCfg.sub}</span>
            </div>

            <p className="ticket-pulse-card__note">{pulse.note}</p>

            <div className="ticket-pulse-card__ctas">
              <a
                href="https://www.fifa.com/tickets"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Official tickets at FIFA ↗
              </a>
              <p className="ticket-pulse-resale-note">
                For resale, check{' '}
                <a href="https://www.stubhub.com" target="_blank" rel="noopener noreferrer">StubHub</a>
                {' '}or{' '}
                <a href="https://www.seatgeek.com" target="_blank" rel="noopener noreferrer">SeatGeek</a>.
                All prices subject to change — not sold through this site.
              </p>
            </div>
          </div>

          <div className="ticket-pulse-how">
            <div className="ticket-pulse-how__title">How to read this</div>
            <div className="ticket-pulse-how__grid">
              {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
                <div key={key} className="ticket-pulse-how__row">
                  <span className="ticket-pulse-action ticket-pulse-action--sm" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <span className="ticket-pulse-how__desc">{cfg.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">Ticket pulse data coming soon for {cityMeta.label}.</div>
      )}

      <p className="dash-disclaimer">
        Cup Radar is an independent fan-built dashboard. Ticket assessments are subjective market reads
        updated manually — not guaranteed. Always purchase through official channels (fifa.com/tickets)
        or verified resale platforms. Cup Radar is not affiliated with FIFA.
      </p>
    </div>
  );
}
