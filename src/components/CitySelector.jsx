import { useCity, HQ_CITIES } from '../context/CityContext';

export default function CitySelector() {
  const { city, setCity } = useCity();

  return (
    <section className="section city-selector" id="hq-select">
      <div className="container">
        <span className="section-label">Your Home Base</span>
        <h2 className="section-heading">Choose your HQ city.</h2>
        <p className="section-sub">
          Cup Radar goes deepest in your home city — match logistics, fan zones,
          transit, ticket watch, and city energy. Pick your base.
        </p>

        <div className="hq-city-grid">
          {Object.values(HQ_CITIES).map(c => (
            <button
              key={c.id}
              className={`hq-city-card${city === c.id ? ' selected' : ''}`}
              onClick={() => setCity(c.id)}
              aria-pressed={city === c.id}
            >
              <div className="hq-city-card__top">
                <span className="hq-city-card__emoji">{c.emoji}</span>
                {city === c.id && <span className="hq-city-card__check">✓ Selected</span>}
                {c.hasQF && <span className="hq-city-card__badge qf">Quarterfinal</span>}
              </div>

              <div className="hq-city-card__name">{c.name}</div>
              <div className="hq-city-card__venue">{c.venue}</div>
              <div className="hq-city-card__tagline">{c.tagline}</div>

              <div className="hq-city-card__highlight">{c.highlight}</div>

              <div className={`hq-city-card__cta${city === c.id ? ' active' : ''}`}>
                {city === c.id ? `View ${c.name} HQ →` : `Select ${c.name}`}
              </div>
            </button>
          ))}
        </div>

        <p className="city-selector__note">
          Your selection is saved. Switch cities any time from the dashboard sidebar.
        </p>
      </div>
    </section>
  );
}
