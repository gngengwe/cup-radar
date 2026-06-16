import { useState, useEffect, useCallback } from 'react';
import { fetchAllMatches, fetchTodayMatches, invalidateLiveCache, isLiveDataEnabled } from '../api/footballData';
import localData from '../data/matches.json';

// Fetches the latest matches.json from GitHub after each bot commit lands.
// raw.githubusercontent.com is CORS-open for public repos; no auth needed.
const REMOTE_MATCHES_URL =
  'https://raw.githubusercontent.com/gngengwe/cup-radar/master/src/data/matches.json';

function hasLiveMatch(matches) {
  return matches.some(m => m.status === 'live');
}

export function useMatches() {
  const [matches,  setMatches]  = useState(localData.matches);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [isLive,   setIsLive]   = useState(false);

  const load = useCallback(async () => {
    if (!isLiveDataEnabled()) return;
    setLoading(true);
    try {
      const live = await fetchAllMatches();
      setMatches(live);
      setError(null);
      if (hasLiveMatch(live)) {
        setIsLive(true);
        invalidateLiveCache();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh every 60s when there's a live match
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [isLive, load]);

  // Periodic refresh from GitHub raw — catches bot commits (goal data, scores)
  // within ~5 min of landing, regardless of whether a live match is in progress.
  useEffect(() => {
    const refreshFromGitHub = async () => {
      try {
        const res = await fetch(REMOTE_MATCHES_URL, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        // Guard against empty/partial responses overwriting good local data
        if (Array.isArray(json?.matches) && json.matches.length >= 50) {
          setMatches(json.matches);
        }
      } catch { /* fail soft — bundled data stays in state */ }
    };
    const id = setInterval(refreshFromGitHub, 5 * 60_000);
    return () => clearInterval(id);
  }, []);

  const source = error || !isLiveDataEnabled() ? 'local' : 'live';

  return { matches, loading, error, source, refresh: load };
}

export function useTodayMatches() {
  const [matches, setMatches]  = useState([]);
  const [loading, setLoading]  = useState(false);
  const [error,   setError]    = useState(null);
  const [source,  setSource]   = useState('local');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Derive today's matches from local data as initial state
    const localToday = localData.matches.filter(m => m.date === todayStr);
    setMatches(localToday);

    if (!isLiveDataEnabled()) return;

    setLoading(true);
    fetchTodayMatches()
      .then(live => {
        setMatches(live);
        setSource('live');
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [todayStr]);

  return { matches, loading, error, source };
}
