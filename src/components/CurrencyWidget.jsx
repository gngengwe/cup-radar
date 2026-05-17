import { useCurrencies } from '../hooks/useCurrencies';

export default function CurrencyWidget({ teamCodes }) {
  const { entries, updatedAt, status } = useCurrencies(teamCodes);

  if (!entries.length) return null;

  const usdEntries  = entries.filter(e => e.note === 'Uses USD' || e.note === 'Local currency');
  const rateEntries = entries.filter(e => !e.note || (e.note !== 'Uses USD' && e.note !== 'Local currency'));

  return (
    <div className="currency-widget">
      <div className="currency-widget__header">
        <span className="currency-widget__title">Currencies in Town</span>
        <span className="currency-widget__meta">
          {status === 'live'   && updatedAt && `open.er-api.com · ${updatedAt}`}
          {status === 'cached' && updatedAt && `open.er-api.com · ${updatedAt} (cached)`}
          {status === 'error'  && 'Rates unavailable'}
          {status === 'loading' && 'Loading…'}
        </span>
      </div>

      <div className="currency-widget__grid">
        {rateEntries.map(e => (
          <div key={e.key} className="currency-rate-card">
            <div className="currency-rate-card__code">{e.code}</div>
            <div className="currency-rate-card__name">{e.name}</div>
            {e.note ? (
              <div className="currency-rate-card__note">{e.note}</div>
            ) : e.rate != null ? (
              <>
                <div className="currency-rate-card__rate">
                  1 USD <span className="currency-rate-card__eq">=</span> {e.rate.toFixed(2)} {e.symbol}
                </div>
                <div className="currency-rate-card__inverse">
                  1 {e.symbol} = ${(1 / e.rate).toFixed(4)}
                </div>
              </>
            ) : (
              <div className="currency-rate-card__note">Rate unavailable</div>
            )}
          </div>
        ))}

        {usdEntries.length > 0 && (
          <div className="currency-rate-card currency-rate-card--usd">
            <div className="currency-rate-card__code">USD</div>
            <div className="currency-rate-card__name">
              {usdEntries.map(e => e.tla).join(', ')} · US Dollar
            </div>
            <div className="currency-rate-card__note">No exchange needed</div>
          </div>
        )}
      </div>

      <p className="currency-widget__disclaimer">
        Indicative rates via open.er-api.com · Updated daily · Not for financial transactions.
      </p>
    </div>
  );
}
