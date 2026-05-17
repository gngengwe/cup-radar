import { useState, useEffect } from 'react';
import { TEAM_CURRENCY } from '../utils/currencyData';

const CACHE_KEY = 'fx_rates_v2';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours
const API_URL   = 'https://open.er-api.com/v6/latest/USD';

function cacheGet() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, expires } = JSON.parse(raw);
    if (Date.now() > expires) { localStorage.removeItem(CACHE_KEY); return null; }
    return data;
  } catch { return null; }
}

function cacheSet(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, expires: Date.now() + CACHE_TTL }));
  } catch {}
}

export function useCurrencies(teamCodes) {
  const [rates,     setRates]     = useState(null);   // null = not yet loaded
  const [updatedAt, setUpdatedAt] = useState(null);
  const [status,    setStatus]    = useState('loading');

  useEffect(() => {
    const cached = cacheGet();
    if (cached) {
      setRates(cached.rates);
      setUpdatedAt(cached.updatedAt);
      setStatus('cached');
      return;
    }

    fetch(API_URL)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(json => {
        if (json.result !== 'success') throw new Error('API error');
        const payload = { rates: json.rates, updatedAt: json.date || json.time_last_update_utc?.slice(0, 10) };
        cacheSet(payload);
        setRates(payload.rates);
        setUpdatedAt(payload.updatedAt);
        setStatus('live');
      })
      .catch(() => setStatus('error'));
  }, []); // fetch once — covers all currencies

  // Build per-team entries — dedupe by currency code
  const entries = (teamCodes || [])
    .filter(tla => TEAM_CURRENCY[tla] && TEAM_CURRENCY[tla].code !== 'USD')
    .reduce((acc, tla) => {
      const meta = TEAM_CURRENCY[tla];
      if (acc.some(e => e.code === meta.code)) return acc;
      const rate = rates === null
        ? undefined                          // still loading
        : (rates[meta.code] ?? null);        // null = currency not in dataset
      acc.push({ tla, ...meta, rate, key: `${tla}-${meta.code}` });
      return acc;
    }, []);

  return { entries, updatedAt, status };
}
