import { useState, useEffect } from 'react';
import { fetchStandings, isLiveDataEnabled } from '../api/footballData';
import localGroups from '../data/groups.json';
import matchData from '../data/matches.json';
import { computeGroupStandings } from '../utils/standings';

export function useStandings() {
  const [standings, setStandings] = useState(() => computeGroupStandings(localGroups, matchData.matches));
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [source,    setSource]    = useState('local');

  useEffect(() => {
    if (!isLiveDataEnabled()) return;

    setLoading(true);
    fetchStandings()
      .then(live => {
        if (live.length > 0) {
          setStandings(live);
          setSource('live');
        }
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { standings, loading, error, source };
}
