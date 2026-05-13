const FEATURES = [
  {
    icon: '🔍',
    title: 'Late Availability Tracking',
    desc: 'Monitor ticket drops across official and resale channels — by match, by city, by date.',
  },
  {
    icon: '📉',
    title: 'Price Drop Signals',
    desc: 'Know when prices floor. Get ahead of the last-minute market rather than chasing it.',
  },
  {
    icon: '🌐',
    title: 'Local vs. Away Opportunities',
    desc: "Compare Seattle matches with out-of-town options when they're the smarter move.",
  },
  {
    icon: '🎯',
    title: '"Should I Go?" Scoring',
    desc: 'Match quality, ticket cost, distance, and availability — combined into one clear signal.',
  },
  {
    icon: '⏱️',
    title: 'Purchase Timing Windows',
    desc: 'Know when to act and when to wait. Timing the ticket market is half the decision.',
  },
  {
    icon: '🔔',
    title: 'Opportunity Alerts',
    desc: 'Surface real chances when they appear — not after the window has already closed.',
  },
];

export default function TicketRadar() {
  return (
    <section className="section section--navy" id="tickets">
      <div className="container">
        <span className="section-label">Ticket Radar</span>
        <h2 className="section-heading">
          Don't just watch prices.<br />Get signals.
        </h2>
        <p className="section-sub">
          The World Cup ticket market is dynamic, opaque, and fast-moving. Ticket Radar tracks
          late availability, price floors, and optimal timing — so you make the move with
          information, not anxiety.
        </p>

        <div className="ticket-features">
          {FEATURES.map(f => (
            <div key={f.title} className="ticket-feature">
              <div className="ticket-feature__icon">{f.icon}</div>
              <div className="ticket-feature__text">
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
