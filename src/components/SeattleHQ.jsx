import { TOURNAMENT } from '../config';

const MODULES = [
  {
    icon: '🗺️',
    title: 'Matchday Logistics',
    body: 'Venue guide, entry gates, bag policy, and local tips — everything you need before kickoff.',
  },
  {
    icon: '🎉',
    title: 'Fan Events & Watch Parties',
    body: "Seattle's official fan zones, watch parties, and street activations across the city.",
  },
  {
    icon: '🚇',
    title: 'Transit Notes',
    body: 'Link Light Rail, shuttle routes, street closures, and parking — match-day specific.',
  },
  {
    icon: '🎫',
    title: 'Ticket Watch',
    body: 'Late availability for Seattle matches, resale signals, and face-value comparison.',
  },
  {
    icon: '🍺',
    title: 'Pre-Game & Food',
    body: 'Bars, restaurants, and neighborhoods for matchday — rated by distance to Lumen Field.',
  },
  {
    icon: '⚡',
    title: 'City Energy',
    body: "Seattle's pulse by match day: crowd density, public screenings, and street-level vibe.",
  },
];

export default function SeattleHQ() {
  return (
    <section className="section section--alt" id="seattle">
      <div className="container">
        <span className="section-label">Seattle HQ</span>
        <h2 className="section-heading">The most tracked host city.</h2>
        <p className="section-sub">
          Seattle hosts six matches at {TOURNAMENT.SEATTLE_VENUE}. Cup Radar goes deeper here than
          anywhere else — from match-day logistics to real-time city energy.
        </p>

        <div className="match-dates-grid">
          {TOURNAMENT.SEATTLE_MATCHES.map(m => (
            <div key={m.date} className="match-date-card">
              <div className="match-date-card__day">{m.day}</div>
              <div className="match-date-card__date">{m.date}</div>
              <div className="match-date-card__venue">{TOURNAMENT.SEATTLE_VENUE}</div>
            </div>
          ))}
        </div>

        <div className="seattle-modules-grid">
          {MODULES.map(m => (
            <div key={m.title} className="card">
              <div className="card-icon">{m.icon}</div>
              <div className="card-title">{m.title}</div>
              <div className="card-body">{m.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
