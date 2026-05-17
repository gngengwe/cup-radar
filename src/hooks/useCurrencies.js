import { useState, useEffect } from 'react';
import { TEAM_CURRENCY, getFrankfurterCodes } from '../utils/currencyData';

const CACHE_KEY = 'fx_rates';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

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

// Returns { rates: { EUR: 0.92, AUD: 1.54, ... }, updatedAt: '2026-05-16', status }
export function useCurrencies(teamCodes) {
  const [rates,     setRates]     = useState({});
  const [updatedAt, setUpdatedAt] = useState(null);
  const [status,    setStatus]    = useState('loading'); // loading | live | cached | error

  useEffect(() => {
    if (!teamCodes?.length) return;

    const codes = getFrankfurterCodes(teamCodes);
    if (!codes.length) { setStatus('done'); return; }

    // Serve from cache if fresh
    const cached = cacheGet();
    if (cached) {
      setRates(cached.rates);
      setUpdatedAt(cached.updatedAt);
      setStatus('cached');
      return;
    }

    const url = `https://api.frankfurter.app/latest?from=USD&to=${codes.join(',')}`;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(json => {
        const payload = { rates: json.rates || {}, updatedAt: json.date };
        cacheSet(payload);
        setRates(payload.rates);
        setUpdatedAt(payload.updatedAt);
        setStatus('live');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [teamCodes?.join(',')]);

  // Build per-team rate entries
  const entries = (teamCodes || [])
    .filter(tla => TEAM_CURRENCY[tla] && TEAM_CURRENCY[tla].code !== 'USD')
    .reduce((acc, tla) => {
      const meta = TEAM_CURRENCY[tla];
      const rate = meta.frankfurter ? rates[meta.code] : null;
      const key  = `${tla}-${meta.code}`;
      if (acc.some(e => e.currencyCode === meta.code)) return acc; // dedupe EUR etc.
      acc.push({ tla, ...meta, rate, key });
      return acc;
    }, []);

  return { entries, updatedAt, status };
}
