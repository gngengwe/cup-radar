const MODULES = [
  {
    icon: '🌅',
    title: 'Today Mode',
    body: 'One-screen daily briefing: the most important match, event, or opportunity for right now.',
  },
  {
    icon: '⚽',
    title: 'Match Tracker',
    body: 'Full tournament schedule, live scores, results, and standings in one clean view.',
  },
  {
    icon: '📊',
    title: 'Group Tracker',
    body: 'All 12 groups, standings, and advancement scenarios across the entire tournament.',
  },
  {
    icon: '🏟️',
    title: 'Seattle HQ',
    body: 'Your deepest local layer: matchday logistics, fan zones, transit, food, and city energy.',
  },
  {
    icon: '🎫',
    title: 'Ticket Radar',
    body: 'Late availability tracking, price signals, and "should I go?" scoring for every match.',
  },
  {
    icon: '✈️',
    title: 'City Jump',
    body: 'Compare opportunistic trips to other host cities: Vancouver, LA, Dallas, Mexico, and more.',
  },
  {
    icon: '📰',
    title: 'Newsroom',
    body: 'Curated tournament news, stories, and moments worth following — no noise.',
  },
  {
    icon: '👕',
    title: 'Jersey & Culture',
    body: 'Kit drops, fan culture moments, and the gear worth knowing about.',
  },
];

export default function WhatWeTrack() {
  return (
    <section className="section" id="modules">
      <div className="container">
        <span className="section-label">Full Coverage</span>
        <h2 className="section-heading">What Cup Radar tracks.</h2>
        <p className="section-sub">
          Eight coverage modules. One dashboard. Built for fans who want signal, not noise.
        </p>

        <div className="track-grid">
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
