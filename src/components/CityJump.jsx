const CITIES = [
  { flag: '🇺🇸', name: 'Seattle',          country: 'USA',    tag: 'Home base',   home: true  },
  { flag: '🇨🇦', name: 'Vancouver',         country: 'Canada', tag: 'Drive or fly'             },
  { flag: '🇺🇸', name: 'Los Angeles',       country: 'USA',    tag: 'Major matches'            },
  { flag: '🇺🇸', name: 'San Francisco Bay', country: 'USA',    tag: 'Short hop'                },
  { flag: '🇺🇸', name: 'Dallas',            country: 'USA',    tag: 'Group + KO'               },
  { flag: '🇺🇸', name: 'New York / NJ',     country: 'USA',    tag: 'Final venue'              },
  { flag: '🇲🇽', name: 'Mexico City',       country: 'Mexico', tag: 'International'            },
  { flag: '🇲🇽', name: 'Guadalajara',       country: 'Mexico', tag: 'International'            },
];

const FACTORS = [
  'Match quality & stage',
  'Ticket availability window',
  'SEA → City flights',
  'Hotel feasibility',
  'City energy & experience',
  '"Is it worth the trip?" score',
];

export default function CityJump() {
  return (
    <section className="section section--alt" id="city-jump">
      <div className="container">
        <span className="section-label">City Jump</span>
        <h2 className="section-heading">
          The World Cup is in 16 cities.<br />
          We'll help you spot the trips worth taking.
        </h2>
        <p className="section-sub">
          City Jump compares opportunistic travel across all host cities — weighed against match
          quality, ticket windows, flight and hotel feasibility from Seattle, and city-level
          World Cup energy.
        </p>

        <div className="city-grid">
          {CITIES.map(c => (
            <div key={c.name} className={`city-card${c.home ? ' city-card--home' : ''}`}>
              <div className="city-card__flag">{c.flag}</div>
              <div className="city-card__name">{c.name}</div>
              <div className="city-card__country">{c.country}</div>
              <span className="city-card__tag">{c.tag}</span>
            </div>
          ))}
        </div>

        <p className="cj-factors-label">Scoring factors</p>
        <div className="cj-factors">
          {FACTORS.map(f => (
            <span key={f} className="factor-chip">{f}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
