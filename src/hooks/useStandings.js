import { useState, useEffect } from 'react';
import { fetchStandings, isLiveDataEnabled } from '../api/footballData';
import localGroups from '../data/groups.json';

export function useStandings() {
  const [standings, setStandings] = useState(localGroups.groups);
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
