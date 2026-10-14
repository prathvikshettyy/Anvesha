/**
 * client/src/hooks/useApiData.js
 *
 * Generic data-fetching hook with loading/error state.
 * Falls back to `fallback` if the API call fails (offline / not logged in).
 */
import { useState, useEffect, useCallback } from 'react';

/**
 * @param {() => Promise<any>} fetchFn  - async function returning data
 * @param {any}                fallback  - value to use when fetchFn throws
 * @param {any[]}              deps      - extra dependency array items
 */
export function useApiData(fetchFn, fallback = null, deps = []) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.message);
      setData(fallback);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load, setData };
}
