import { useState, useCallback } from 'react';

/**
 * Generic hook for making API calls with loading/error state.
 * Usage: const { data, loading, error, execute } = useApi(apiFn);
 */
export function useApi(apiFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      setData(result);
      return result;
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Something went wrong';
      setError(message);
      console.error('[useApi] Error:', message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { data, loading, error, execute };
}
