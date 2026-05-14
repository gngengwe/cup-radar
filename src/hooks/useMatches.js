import { useState, useEffect, useCallback } from 'react';
import { fetchAllMatches, fetchTodayMatches, invalidateLiveCache } from '../api/footballData';
import localData from '../data/matches.json';

function hasLiveMatch(matches) {
  return matches.some(m => m.status === 'live');
}

export function useMatches() {
  const [matches,  setMatches]  = useState(localData.matches);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [isLive,   setIsLive]   = useState(false);

  const load = useCallback(async () => {
    const apiKey = import.meta.env.VITE_FOOTBALL_API_KEY;
    if (!apiKey) return;
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

  const source = error || !import.meta.env.VITE_FOOTBALL_API_KEY ? 'local' : 'live';

  return { matches, loading, error, source, refresh: load };
}

export function useTodayMatches() {
  const [matches, setMatches]  = useState([]);
  const [loading, setLoading]  = useState(false);
  const [error,   setError]    = useState(null);
  const [source,  setSource]   = useState('local');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const apiKey = import.meta.env.VITE_FOOTBALL_API_KEY;

    // Derive today's matches from local data as initial state
    const localToday = localData.matches.filter(m => m.date === todayStr);
    setMatches(localToday);

    if (!apiKey) return;

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
